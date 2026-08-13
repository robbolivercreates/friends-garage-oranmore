/**
 * Vehicle lookup provider abstraction.
 *
 * Chain of responsibility:
 *   1. parsePlate (built-in, free — year/county/format)
 *   2. own database (already visited)
 *   3. configured providers, in order (none by default)
 *   4. manual entry (the UI always falls back to this)
 *
 * A paid provider (Cartell, Motorcheck, UK DVLA, …) can be added later by
 * implementing PlateLookupProvider and registering it in PROVIDERS — the
 * only config it needs is an API key in the environment. Everything works
 * perfectly with zero providers configured.
 */

export interface VehicleLookupInfo {
  make?: string;
  model?: string;
  engine?: string;
  fuelType?: string;
  colour?: string;
  year?: number;
}

export interface PlateLookupProvider {
  name: string;
  isConfigured(): boolean;
  lookup(registration: string): Promise<VehicleLookupInfo | null>;
}

/** Default provider: deliberately does nothing. Manual entry covers it. */
class NoOpProvider implements PlateLookupProvider {
  name = 'none';
  isConfigured() { return true; }
  async lookup() { return null; }
}

/**
 * Placeholder for a future paid provider. Shows the exact shape required:
 * drop in the endpoint + field mapping and set PLATE_LOOKUP_API_KEY.
 */
class ExternalApiProvider implements PlateLookupProvider {
  name = 'external-api';
  isConfigured() { return Boolean(process.env.PLATE_LOOKUP_API_KEY); }
  async lookup(registration: string): Promise<VehicleLookupInfo | null> {
    if (!this.isConfigured()) return null;
    try {
      // const res = await fetch(`https://provider.example/lookup?reg=${registration}`, {
      //   headers: { 'x-api-key': process.env.PLATE_LOOKUP_API_KEY! }
      // });
      // const data = await res.json();
      // return { make: data.make, model: data.model, engine: data.engine, year: data.year };
      return null; // not implemented until a provider is chosen
    } catch {
      return null; // provider failure must NEVER break the workflow
    }
  }
}

const PROVIDERS: PlateLookupProvider[] = [new ExternalApiProvider(), new NoOpProvider()];

export async function lookupWithProviders(registration: string): Promise<{ info: VehicleLookupInfo | null; provider: string }> {
  for (const provider of PROVIDERS) {
    if (!provider.isConfigured()) continue;
    const info = await provider.lookup(registration);
    if (info) return { info, provider: provider.name };
  }
  return { info: null, provider: 'manual' };
}
