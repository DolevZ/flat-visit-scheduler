export { TIME_ZONE } from "@/lib/constants";

export function getRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is not configured.`);
  }

  return value;
}

export function getGooglePrivateKey() {
  getRequiredEnv("GOOGLE_PRIVATE_KEY");
  return process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n");
}
