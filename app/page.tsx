"use client";

import { Fragment, FormEvent, useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AccentId, Address, CollectionDay, CollectionResponse, ThemeMode, WasteType } from "../lib/types";
import { addressSettingsService } from "../services/address-settings";
import { themeSettingsService } from "../services/theme-settings";
import { ACCENTS, DEFAULT_ACCENT, DEFAULT_MODE, THEME_MODE_LABELS, resolveTheme } from "../lib/theme";
import { cacheService } from "../services/collection-cache";
import { getBrusselsDateKey, getNextDateKeys, longDutchDate } from "../lib/dates";
import { getWastePresentation } from "../lib/waste-normalization";
import { mockResponse } from "../lib/mock-data";

type ViewState = "loading" | "settings" | "ready" | "error";

async function readCollectionResponse(response: Response): Promise<CollectionResponse> {
  const text = await response.text();
  let body: CollectionResponse & { error?: string };
  try {
    body = JSON.parse(text) as CollectionResponse & { error?: string };
  } catch {
    throw new Error("De kalenderdienst gaf een onverwacht antwoord. Probeer het zo meteen opnieuw.");
  }
  if (!response.ok) {
    const message = body.error || "De kalender kon niet worden opgehaald.";
    throw new Error(message.toLowerCase().includes("internal error")
      ? "De kalenderdienst ondervond een technisch probleem. Probeer het zo meteen opnieuw."
      : message);
  }
  return body;
}

function WasteIcon({ waste }: { waste: WasteType }) {
  const presentation = getWastePresentation(waste);
  return (
    <span className="waste-icon" style={{ "--waste-color": presentation.color } as React.CSSProperties}
      role="img" aria-label={presentation.label}>
      <span className="material-symbols-outlined" aria-hidden="true">{presentation.icon}</span>
    </span>
  );
}

function WasteList({ wasteTypes, large = false }: { wasteTypes: WasteType[]; large?: boolean }) {
  if (!wasteTypes.length) return <span className="no-collection">Geen ophaling</span>;
  return (
    <div className={`waste-list ${large ? "large" : ""}`}>
      {wasteTypes.map((waste) => (
        <div className="waste-item" key={`${waste.code}-${waste.name}`}>
          <WasteIcon waste={waste} /><span>{waste.name}</span>
        </div>
      ))}
    </div>
  );
}

function AddressForm({ initial, onSuccess, onCancel }: {
  initial?: Address | null;
  onSuccess: (address: Address, data: CollectionResponse) => void;
  onCancel?: () => void;
}) {
  const [postalCode, setPostalCode] = useState(initial?.postalCode ?? "");
  const [street, setStreet] = useState(initial?.street ?? "");
  const [houseNumber, setHouseNumber] = useState(initial?.houseNumber ?? "");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    const address = { postalCode: postalCode.trim(), street: street.trim(), houseNumber: houseNumber.trim() };
    try {
      const dates = getNextDateKeys(14);
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, startDate: dates[0], endDate: dates.at(-1) }),
      });
      const body = await readCollectionResponse(response);
      addressSettingsService.saveAddress(address);
      cacheService.save(address, body);
      onSuccess(address, body);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Er ging iets mis. Probeer opnieuw.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="settings-card" aria-labelledby="address-title">
      <div className="eyebrow">Eenmalig instellen</div>
      <h1 id="address-title">Voor welk adres wil je de ophalingen zien?</h1>
      <p className="intro">Je adres blijft alleen in deze browser bewaard.</p>
      <form onSubmit={submit}>
        <div className="field-row">
          <label>Postcode
            <input inputMode="numeric" autoComplete="postal-code" pattern="[0-9]{4}" value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)} placeholder="2800" required />
          </label>
          <label>Huisnummer
            <input inputMode="numeric" autoComplete="address-line2" value={houseNumber}
              onChange={(e) => setHouseNumber(e.target.value)} placeholder="10" required />
          </label>
        </div>
        <label>Straat
          <input autoComplete="address-line1" value={street} onChange={(e) => setStreet(e.target.value)}
            placeholder="Straatnaam" required />
        </label>
        {message && <div className="error-message" role="alert">{message}</div>}
        <div className="button-row">
          <button className="primary-button" disabled={busy}>{busy ? "Adres controleren…" : "Ophaalkalender laden"}</button>
          {onCancel && <button type="button" className="text-button" onClick={onCancel}>Annuleren</button>}
        </div>
      </form>
      <button type="button" className="demo-button" onClick={() => onSuccess(mockResponse.address, mockResponse)}>
        Bekijk eerst een voorbeeld
      </button>
    </section>
  );
}

const MODE_ORDER: ThemeMode[] = ["light", "dark", "system"];
const DARK_QUERY = "(prefers-color-scheme: dark)";

function subscribeToColorScheme(onChange: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

/**
 * Reads the appearance preferences straight from their stores, so a second tab
 * or a change to the OS setting is picked up without extra wiring. The stored
 * mode and accent are also what the layout's bootstrap script applies before
 * first paint; this hook keeps <html> in sync from then on.
 */
function useAppearance() {
  const mode = useSyncExternalStore(
    themeSettingsService.subscribe,
    () => themeSettingsService.getMode() ?? DEFAULT_MODE,
    () => DEFAULT_MODE,
  );
  const accent = useSyncExternalStore(
    themeSettingsService.subscribe,
    () => themeSettingsService.getAccent() ?? DEFAULT_ACCENT,
    () => DEFAULT_ACCENT,
  );
  const prefersDark = useSyncExternalStore(subscribeToColorScheme, () => window.matchMedia(DARK_QUERY).matches, () => false);

  const theme = resolveTheme(mode, prefersDark);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.setAttribute("data-accent", accent);
  }, [theme, accent]);

  return {
    mode,
    accent,
    changeMode: themeSettingsService.saveMode,
    changeAccent: themeSettingsService.saveAccent,
  };
}

function AppearanceSettings({ mode, accent, onModeChange, onAccentChange }: {
  mode: ThemeMode;
  accent: AccentId;
  onModeChange: (mode: ThemeMode) => void;
  onAccentChange: (accent: AccentId) => void;
}) {
  return (
    <section className="settings-card" aria-labelledby="appearance-title">
      <div className="eyebrow">Uiterlijk</div>
      <h2 id="appearance-title">Kies je thema en kleur</h2>
      <p className="appearance-hint">Je keuze blijft alleen in deze browser bewaard.</p>

      <fieldset className="appearance-group">
        <legend>Modus</legend>
        <div className="mode-options">
          {MODE_ORDER.map((option) => (
            <Fragment key={option}>
              <input type="radio" id={`theme-mode-${option}`} name="theme-mode" value={option}
                checked={mode === option} onChange={() => onModeChange(option)} />
              <label className="mode-option" htmlFor={`theme-mode-${option}`}>
                <span className="material-symbols-outlined" aria-hidden="true">{THEME_MODE_LABELS[option].icon}</span>
                {THEME_MODE_LABELS[option].label}
              </label>
            </Fragment>
          ))}
        </div>
      </fieldset>

      <fieldset className="appearance-group">
        <legend>Accentkleur</legend>
        <div className="accent-grid">
          {ACCENTS.map((option) => (
            <Fragment key={option.id}>
              <input type="radio" id={`accent-${option.id}`} name="accent" value={option.id}
                checked={accent === option.id} onChange={() => onAccentChange(option.id)} />
              <label className="accent-swatch" data-accent={option.id} htmlFor={`accent-${option.id}`} title={option.label}>
                <span className="material-symbols-outlined" aria-hidden="true">check</span>
                <span className="visually-hidden">{option.label}</span>
              </label>
            </Fragment>
          ))}
        </div>
      </fieldset>
    </section>
  );
}

export default function Home() {
  const [state, setState] = useState<ViewState>("loading");
  const [address, setAddress] = useState<Address | null>(null);
  const [data, setData] = useState<CollectionResponse | null>(null);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const appearance = useAppearance();

  const load = useCallback(async (savedAddress: Address, force = false) => {
    const cached = cacheService.get(savedAddress);
    if (!force && cached && !cached.expired) {
      setData(cached.data); setState("ready"); return;
    }
    setRefreshing(true);
    try {
      const dates = getNextDateKeys(14);
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: savedAddress, startDate: dates[0], endDate: dates.at(-1) }),
      });
      const body = await readCollectionResponse(response);
      cacheService.save(savedAddress, body);
      setData(body); setError(""); setState("ready");
    } catch (reason) {
      if (cached) {
        setData(cached.data);
        setError("Actuele gegevens zijn tijdelijk niet beschikbaar. Je ziet de laatst opgehaalde kalender.");
        setState("ready");
      } else {
        setError(reason instanceof Error ? reason.message : "De kalender kon niet worden geladen.");
        setState("error");
      }
    } finally { setRefreshing(false); }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(() => {
      const savedAddress = addressSettingsService.getAddress();
      if (!savedAddress) {
        setState("settings");
        return;
      }
      setAddress(savedAddress);
      void load(savedAddress);
    });
  }, [load]);

  const days = useMemo(() => {
    const keys = getNextDateKeys(7);
    const byDate = new Map((data?.collections ?? []).map((item) => [item.date, item]));
    return keys.map((date) => byDate.get(date) ?? { date, wasteTypes: [] });
  }, [data]);

  const tomorrow = days[0];
  const nextCollection = useMemo(() => {
    if (!data || tomorrow?.wasteTypes.length) return null;
    return data.collections.filter((item) => item.date > (tomorrow?.date ?? getBrusselsDateKey()))
      .find((item) => item.wasteTypes.length);
  }, [data, tomorrow]);

  function acceptAddress(newAddress: Address, response: CollectionResponse) {
    setAddress(newAddress); setData(response); setError(""); setSettingsOpen(false); setState("ready");
  }

  function forgetAddress() {
    addressSettingsService.clearAddress(); cacheService.clear();
    setAddress(null); setData(null); setSettingsOpen(false); setState("settings");
  }

  if (state === "loading") return <main className="center-state" aria-live="polite"><div className="loader" /><p>Ophaalkalender laden…</p></main>;
  if (state === "settings" || settingsOpen) {
    return (
      <main className="app-shell narrow">
        <AddressForm initial={address} onSuccess={acceptAddress}
          onCancel={settingsOpen ? () => setSettingsOpen(false) : undefined} />

        <AppearanceSettings mode={appearance.mode} accent={appearance.accent}
          onModeChange={appearance.changeMode} onAccentChange={appearance.changeAccent} />
        {settingsOpen && <button className="danger-button" type="button" onClick={forgetAddress}>Adres vergeten</button>}
      </main>
    );
  }
  if (state === "error" || !data || !address || !tomorrow) {
    return (
      <main className="center-state"><div className="error-panel" role="alert">
        <span className="error-icon">!</span><h1>De kalender kon niet worden geladen</h1><p>{error}</p>
        <div className="button-row">
          {address && <button className="primary-button" onClick={() => void load(address, true)}>Opnieuw proberen</button>}
          <button className="text-button" onClick={() => setSettingsOpen(true)}>Adres aanpassen</button>
          <button className="text-button" onClick={() => acceptAddress(mockResponse.address, mockResponse)}>Voorbeelddata tonen</button>
        </div>
      </div></main>
    );
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#main-content" aria-label="Afval Kalender, naar inhoud">
          <span className="brand-mark" aria-hidden="true">
            <span className="material-symbols-outlined">recycling</span>
          </span>
          <span>Afval Kalender</span>
        </a>
        <button className="settings-button" onClick={() => setSettingsOpen(true)} aria-label="Instellingen openen">
          <span className="material-symbols-outlined" aria-hidden="true">settings</span> Instellingen
        </button>
      </header>
      <div id="main-content">
        {error && <div className="warning-banner" role="status">{error}</div>}
        <section className={`tomorrow-card ${tomorrow.wasteTypes.length ? "has-collection" : ""}`} aria-labelledby="tomorrow-title">
          <div><div className="eyebrow light">Eerstvolgende dag</div><h1 id="tomorrow-title">Morgen</h1>
            <p className="tomorrow-date">{longDutchDate(tomorrow.date)}</p></div>
          <div className="tomorrow-content">
            {tomorrow.wasteTypes.length ? <>
              <WasteList wasteTypes={tomorrow.wasteTypes} large />
              <p className="callout">Zet dit afval vanavond buiten</p>
            </> : <>
              <h2>Geen afvalophaling morgen</h2>
              {nextCollection && <p className="next-collection">Volgende ophaling: <strong>
                {nextCollection.wasteTypes.map((w) => w.name).join(" en ")}</strong> op {longDutchDate(nextCollection.date)}</p>}
            </>}
          </div>
        </section>
        <div className="section-heading">
          <div><div className="eyebrow">Plan vooruit</div><h2>Komende zeven dagen</h2></div>
          <button className="refresh-button" disabled={refreshing} onClick={() => void load(address, true)}>
            <span className="material-symbols-outlined" aria-hidden="true">refresh</span> {refreshing ? "Vernieuwen…" : "Vernieuwen"}
          </button>
        </div>
        <section className="days-grid" aria-label="Afvalophalingen voor de komende zeven dagen">
          {days.map((day: CollectionDay, index) => (
            <article className={`day-card ${day.wasteTypes.length ? "active" : ""}`} key={day.date}>
              <div className="day-top"><div>
                <span className="day-name">{index === 0 ? "Morgen" : new Intl.DateTimeFormat("nl-BE", {
                  weekday: "long", timeZone: "Europe/Brussels",
                }).format(new Date(`${day.date}T12:00:00Z`))}</span>
                <span className="day-date">{new Intl.DateTimeFormat("nl-BE", {
                  day: "numeric", month: "short", timeZone: "Europe/Brussels",
                }).format(new Date(`${day.date}T12:00:00Z`))}</span>
              </div>{day.wasteTypes.length > 0 && <span className="collection-dot" aria-label="Ophaling gepland" />}</div>
              <WasteList wasteTypes={day.wasteTypes} />
            </article>
          ))}
        </section>
        <footer>
          <p>{data.isMock ? "Voorbeeldgegevens" : `Kalender voor ${address.street} ${address.houseNumber}, ${address.postalCode}`}</p>
          <p>Laatst bijgewerkt op {new Intl.DateTimeFormat("nl-BE", {
            dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Brussels",
          }).format(new Date(data.lastUpdated))}</p>
          <a href="https://diftar.ivarem.be/Ophaalkalender/input" target="_blank" rel="noreferrer">Gegevensbron: IVAREM</a>
        </footer>
      </div>
    </main>
  );
}
