function getEnv(name: "API_URL" | "HISTORY_API_URL" | "BITCOIN_API_URL" | "BASE_URL"): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value.replace(/\/$/, "");
}

export const env = {
  get apiUrl() {
    return getEnv("API_URL");
  },
  get historyApiUrl() {
    return getEnv("HISTORY_API_URL");
  },
  get bitcoinApiUrl() {
    return getEnv("BITCOIN_API_URL");
  },
  get baseUrl() {
    return getEnv("BASE_URL");
  },
};
