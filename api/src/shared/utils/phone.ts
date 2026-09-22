import { parsePhoneNumberFromString } from "libphonenumber-js";

/** Normalizes a phone number to E.164 (e.g. "+5511999999999") for the given
 * country, or returns null if it isn't a valid number. Pure-JS, no native
 * dependency — safe on a machine with no build tools. */
export function toE164(raw: string, countryCode: string): string | null {
  const parsed = parsePhoneNumberFromString(raw, countryCode as never);
  return parsed?.isValid() ? parsed.number : null;
}
