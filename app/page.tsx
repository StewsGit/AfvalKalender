"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Address, CollectionDay, CollectionResponse, WasteType } from "../lib/types";
import { addressSettingsService } from "../services/address-settings";
import {
  AppearanceSettings,
  ColorScheme,
  DEFAULT_APPEARANCE_SETTINGS,
  ThemeMode,
  appearanceSettingsService,
} from "../services/appearance-settings";
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

const THEME_OPTIONS: { value: ThemeMode; label: string; icon: string }[] = [
  { value: "light", label: "Licht", icon: "light_mode" },
  { value: "dark", label: "Donker", icon: "dark_mode" },
];

const COLOR_OPTIONS: { value: ColorScheme; label: string; color: string }[] = [
  { value: "forest", label: "Bosgroen", color: "#176b52" },
  { value: "ocean", label: "Oceaan", color: "#176b8f" },
  { value: "berry", label: "Bessen", color: "#8a3f74" },
  { value: "sunset", label: "Avondrood", color: "#b85c2c" },
];

function AppearanceControls({ value, onChange }: {
  value: AppearanceSettings;
  onChange: (settings: AppearanceSettings) => void;
}) {
  return (
    <fieldset className="appearance-settings">
      <legend>Weergave</legend>
      <p className="settings-help">Je keuzes worden meteen toegepast en in deze browser bewaard.</p>

      <div className="appearance-group">
        <span className="control-label">Modus</span>
        <div className="mode-options" aria-label="Kies lichte of donkere modus">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`mode-option ${value.themeMode === option.value ? "selected" : ""}`}
              aria-pressed={value.themeMode === option.value}
              onClick={() => onChange({ ...value, themeMode: option.value })}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="appearance-group">
        <span className="control-label">Kleurenschema</span>
        <div className="color-options" aria-label="Kies een kleurenschema">
          {COLOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`color-option ${value.colorScheme === option.value ? "selected" : ""}`}
              aria-pressed={value.colorScheme === option.value}
              onClick={() => onChange({ ...value, colorScheme: option.value })}
            >
              <span className="color-swatch" style={{ background: option.color }} aria-hidden="true" />
              <span>{option.label}</span>
              <span className="selection-check" aria-hidden="true">✓</span>
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  );
}

function AddressForm({ initial, appearance, onAppearanceChange, onSuccess, onCancel }: {
  initial?: Address | null;
  appearance: AppearanceSettings;
  onAppearanceChange: (settings: AppearanceSettings) => void;
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

  const editing = Boolean(onCancel);

  return (
    <section className="settings-card" aria-labelledby="address-title">
      <div className="eyebrow">{editing ? "Instellingen" : "Eenmalig instellen"}</div>
      <h1 id="address-title">{editing ? "Pas je Afval Kalender aan" : "Voor welk adres wil je de ophalingen zien?"}</h1>
      <p className="intro">Je adres en weergavevoorkeuren blijven alleen in deze browser bewaard.</p>

      <AppearanceControls value={appearance} onChange={onAppearanceChange} />

      <div className="settings-divider" />
      <div className="address-heading">
        <span className="material-symbols-outlined" aria-hidden="true">location_on</span>
        <h2>Adres</h2>
      </div>
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
          <button className="primary-button" disabled={busy}>{busy ? "Adres controleren…" : editing ? "Adres opslaan" : "Ophaalkalender laden"}</button>
          {onCancel && <button type="button" className="text-button" onClick={onCancel}>Annuleren</button>}
        </div>
      </form>
      <button type="button" className="demo-button" onClick={() => onSuccess(mockResponse.address, mockResponse)}>
        Bekijk eerst een voorbeeld
      </button>
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
  const [appearance, setAppearance] = useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);

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
      const savedAppearance = appearanceSettingsService.get();
      appearanceSettingsService.apply(savedAppearance);
      setAppearance(savedAppearance);

      const savedAddress = addressSettingsService.getAddress();
      if (!savedAddress) { setState("settings"); return; }
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
  function updateAppearance(settings: AppearanceSettings) {
    appearanceSettingsService.save(settings);
    appearanceSettingsService.apply(settings);
    setAppearance(settings);
  }
  function forgetAddress() {
    addressSettingsService.clearAddress(); cacheService.clear();
    setAddress(null); setData(null); setSettingsOpen(false); setState("settings");
  }

  if (state === "loading") return <main className="center-state" aria-live="polite"><div className="loader" /><p>Ophaalkalender laden…</p></main>;
  if (state === "settings" || settingsOpen) {
    return (
      <main className="app-shell narrow">
        <AddressForm initial={address} appearance={appearance} onAppearanceChange={updateAppearance} onSuccess={acceptAddress}
          onCancel={settingsOpen ? () => setSettingsOpen(false) : undefined} />
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
