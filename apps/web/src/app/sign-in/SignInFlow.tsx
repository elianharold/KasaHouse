'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { UserRole } from '@kasahouse/shared-types';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import {
  usePasswordLogin,
  useRequestEmailOtp,
  useRequestOtp,
  useSession,
  useVerifyEmailOtp,
  useVerifyOtp,
} from '@/hooks/use-auth';
import { toApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

type Method = 'phone' | 'email';
type Step = 'enter' | 'code' | 'role';

const PHONE_RE = /^(?:\+233\d{9}|0\d{9})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') || '/browse';
  const { isAuthenticated, needsRole } = useSession();

  const requestPhone = useRequestOtp();
  const requestEmail = useRequestEmailOtp();
  const verifyPhone = useVerifyOtp();
  const verifyEmail = useVerifyEmailOtp();
  const passwordLogin = usePasswordLogin();

  const [method, setMethod] = useState<Method>('phone');
  const [step, setStep] = useState<Step>('enter');

  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [challengeId, setChallengeId] = useState('');
  const [masked, setMasked] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string>();
  const [role, setRole] = useState<UserRole | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && !needsRole) router.replace(nextUrl);
    else if (isAuthenticated && needsRole) setStep('role');
  }, [isAuthenticated, needsRole, nextUrl, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const requesting = requestPhone.isPending || requestEmail.isPending;
  const verifying = verifyPhone.isPending || verifyEmail.isPending;

  const sendCode = async () => {
    setError(null);
    try {
      if (method === 'phone') {
        if (!PHONE_RE.test(phone.trim())) {
          setError('Enter a Ghana mobile number, e.g. 024 123 4567.');
          return;
        }
        const res = await requestPhone.mutateAsync({ phone: phone.trim() });
        setChallengeId(res.challengeId);
        setMasked(res.maskedDestination);
        setDevCode(res.devCode);
        setCode(res.devCode ?? '');
        setCooldown(res.resendAfterSeconds);
      } else {
        if (!EMAIL_RE.test(email.trim())) {
          setError('Enter a valid email address.');
          return;
        }
        const res = await requestEmail.mutateAsync({ email: email.trim() });
        setChallengeId(res.challengeId);
        setMasked(res.maskedDestination);
        setDevCode(res.devCode);
        setCode(res.devCode ?? '');
        setCooldown(res.resendAfterSeconds);
      }
      setStep('code');
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  const signInWithPassword = async () => {
    setError(null);
    try {
      await passwordLogin.mutateAsync({ email: email.trim(), password });
    } catch (e) {
      const err = toApiError(e);
      if (err.code === 'PASSWORD_NOT_SET') {
        setError('No password on this account yet — use an email code, then set one in your profile.');
        return;
      }
      setError(err.message);
    }
  };

  const verify = async (withRole?: UserRole) => {
    setError(null);
    const mutation = method === 'phone' ? verifyPhone : verifyEmail;
    try {
      await mutation.mutateAsync({ challengeId, code, role: withRole });
    } catch (e) {
      const err = toApiError(e);
      if (err.code === 'ROLE_REQUIRED_FOR_SIGNUP') {
        setStep('role');
        return;
      }
      setError(err.message);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const res =
        method === 'phone'
          ? await requestPhone.mutateAsync({ phone: phone.trim() })
          : await requestEmail.mutateAsync({ email: email.trim() });
      setChallengeId(res.challengeId);
      setCooldown(res.resendAfterSeconds);
      if (res.devCode) setCode(res.devCode);
    } catch (e) {
      const err = toApiError(e);
      setError(err.message);
      if (err.retryAfterSeconds) setCooldown(err.retryAfterSeconds);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-2xl font-bold text-ink">
        {step === 'enter' && 'Sign in or create an account'}
        {step === 'code' && 'Enter your code'}
        {step === 'role' && 'How will you use KasaHouse?'}
      </h1>

      {step === 'enter' && (
        <div className="mt-6">
          <div className="mb-5 flex rounded-xl border border-line p-1">
            {(['phone', 'email'] as Method[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMethod(m);
                  setError(null);
                }}
                className={cn(
                  'flex-1 rounded-lg py-2 text-sm font-medium capitalize',
                  method === m ? 'bg-brand text-white' : 'text-ink-muted',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          {method === 'phone' ? (
            <Field label="Phone number" hint="We'll text you a 6-digit code.">
              {(id) => (
                <Input
                  id={id}
                  type="tel"
                  autoFocus
                  placeholder="024 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                />
              )}
            </Field>
          ) : (
            <>
              <Field label="Email address" hint="We'll email you a 6-digit code.">
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    autoFocus
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendCode()}
                  />
                )}
              </Field>

              {showPassword ? (
                <Field label="Password">
                  {(id) => (
                    <Input
                      id={id}
                      type="password"
                      placeholder="Your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && signInWithPassword()}
                    />
                  )}
                </Field>
              ) : null}
            </>
          )}

          {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

          {method === 'email' && showPassword ? (
            <Button
              fullWidth
              loading={passwordLogin.isPending}
              disabled={!password}
              onClick={signInWithPassword}
            >
              Sign in with password
            </Button>
          ) : (
            <Button fullWidth loading={requesting} onClick={sendCode}>
              Send code
            </Button>
          )}

          {method === 'email' ? (
            <button
              type="button"
              onClick={() => {
                setShowPassword((v) => !v);
                setError(null);
              }}
              className="mt-3 w-full text-center text-sm text-brand-dark"
            >
              {showPassword ? 'Use an email code instead' : 'I have a password'}
            </button>
          ) : null}
        </div>
      )}

      {step === 'code' && (
        <div className="mt-6">
          <p className="text-sm text-ink-muted">
            Sent to {masked}.{' '}
            <button
              type="button"
              className="font-medium text-brand-dark underline"
              onClick={() => setStep('enter')}
            >
              Change
            </button>
          </p>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputMode="numeric"
            autoFocus
            placeholder="––––––"
            className="mt-4 w-full rounded-xl border border-line bg-surface px-4 py-3 text-center text-2xl tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-brand/30"
          />
          {devCode ? (
            <p className="mt-2 text-center text-xs text-ink-faint">
              Dev build: code auto-filled from the API ({devCode}).
            </p>
          ) : null}
          {error ? <p className="mt-3 text-center text-sm text-danger">{error}</p> : null}

          <Button
            className="mt-5"
            fullWidth
            loading={verifying}
            disabled={code.length < 4}
            onClick={() => verify()}
          >
            Verify &amp; continue
          </Button>

          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || requesting}
            className="mt-4 w-full text-center text-sm text-ink-muted disabled:opacity-60"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      )}

      {step === 'role' && (
        <div className="mt-6">
          <p className="text-sm text-ink-muted">You can add the other role later in your profile.</p>
          <div className="mt-4 space-y-3">
            {[
              {
                value: UserRole.TENANT,
                title: "I'm looking for a place",
                body: 'Browse listings, chat with owners, and pay rent through KasaHouse.',
              },
              {
                value: UserRole.LANDLORD,
                title: 'I have a property to list',
                body: 'List with photos and a video, and reach tenants and buyers directly.',
              },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRole(opt.value)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left',
                  role === opt.value ? 'border-brand bg-brand-light' : 'border-line bg-surface',
                )}
              >
                <p className="font-semibold text-ink">{opt.title}</p>
                <p className="mt-1 text-sm text-ink-muted">{opt.body}</p>
              </button>
            ))}
          </div>
          {error ? <p className="mt-3 text-center text-sm text-danger">{error}</p> : null}
          <Button
            className="mt-5"
            fullWidth
            disabled={!role}
            loading={verifying}
            onClick={() => role && verify(role)}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
