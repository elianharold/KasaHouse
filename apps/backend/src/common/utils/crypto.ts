import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/** Numeric OTP of the given length, uniformly distributed, no leading-zero bias. */
export const generateNumericCode = (length: number): string => {
  let code = '';
  for (let i = 0; i < length; i += 1) {
    code += randomInt(0, 10).toString();
  }
  return code;
};

/** Opaque, URL-safe token for refresh tokens. */
export const generateOpaqueToken = (bytes = 48): string =>
  randomBytes(bytes).toString('base64url');

export const sha256 = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

/** Hash an OTP with a server-side pepper so a DB leak can't reverse codes. */
export const hashOtp = (code: string, pepper: string): string =>
  sha256(`${code}:${pepper}`);

/** Constant-time comparison of two hex digests. */
export const safeEqualHex = (a: string, b: string): boolean => {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
};
