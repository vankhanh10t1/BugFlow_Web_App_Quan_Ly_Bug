const legacyStrictModes = new Set(["prefer", "require", "verify-ca"]);

/** Preserve pg v8's strict TLS behavior explicitly before pg v9 changes semantics. */
export function normalizePostgresUrl(connectionString: string) {
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode")?.toLowerCase();
  if (sslMode && legacyStrictModes.has(sslMode)) url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}
