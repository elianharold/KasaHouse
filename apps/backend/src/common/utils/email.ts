import { DomainException } from '../errors/domain.exception';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Lowercase + trim, and reject anything that isn't a plausible address. */
export const normalizeEmail = (input: string): string => {
  const normalized = input.trim().toLowerCase();
  if (!EMAIL_RE.test(normalized) || normalized.length > 254) {
    throw new DomainException('INVALID_EMAIL', 'Enter a valid email address.');
  }
  return normalized;
};

/** ama.boateng@gmail.com -> a***@gmail.com */
export const maskEmail = (email: string): string => {
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
};
