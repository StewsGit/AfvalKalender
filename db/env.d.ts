/// <reference types="@cloudflare/workers-types" />
// Declaration merging on `Cloudflare.Env` so `env` from "cloudflare:workers"
// knows about our bindings. There is no wrangler config in this repo, so this
// replaces what `wrangler types` would otherwise generate.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
  }
}
