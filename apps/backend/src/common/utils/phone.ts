import { parsePhoneNumberFromString } from 'libphonenumber-js';
import { DomainException } from '../errors/domain.exception';

/**
 * Normalise a Ghanaian phone number to E.164 (+233XXXXXXXXX).
 * Accepts local formats ("0201234567", "020 123 4567") and international ones.
 */
export const normalizeGhanaPhone = (input: string): string => {
  const trimmed = input.trim().replace(/\s+/g, '');
  const parsed = parsePhoneNumberFromString(trimmed, 'GH');

  if (!parsed || !parsed.isValid() || parsed.country !== 'GH') {
    throw new DomainException(
      'INVALID_PHONE',
      'Enter a valid Ghanaian mobile number.',
    );
  }
  return parsed.number; // E.164
};

/** +233201234567 -> +2332012***67 */
export const maskPhone = (e164: string): string => {
  if (e164.length < 6) return e164;
  const head = e164.slice(0, e164.length - 5);
  const tail = e164.slice(-2);
  return `${head}***${tail}`;
};
