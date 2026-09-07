import {
  createHash,
  randomBytes,
  randomInt,
  scrypt as scryptCb,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

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

// ─────────────────────── Password hashing (scrypt) ───────────────────────
// Node built-in, no native deps — safe for serverless. Format:
//   scrypt$<saltHex>$<hashHex>

const SCRYPT_KEYLEN = 64;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString('hex')}$${derived.toString('hex')}`;
};

export const verifyPassword = async (
  password: string,
  stored: string,
): Promise<boolean> => {
  const [scheme, saltHex, hashHex] = stored.split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const derived = await scrypt(password, Buffer.from(saltHex, 'hex'), SCRYPT_KEYLEN);
  const expected = Buffer.from(hashHex, 'hex');
  return derived.length === expected.length && timingSafeEqual(derived, expected);
};
