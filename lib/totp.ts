import { generateSecret, generateURI, verify } from "otplib";

const ISSUER = "Sul Prêmios";

export function totpGenerateSecret(): string {
  return generateSecret();
}

export function totpGenerateURI(secret: string, label: string): string {
  return generateURI({
    issuer: ISSUER,
    label: label.replace(/:/g, ""),
    secret,
  });
}

export async function totpVerify(secret: string, token: string): Promise<boolean> {
  const result = await verify({ secret, token });
  return result.valid;
}
