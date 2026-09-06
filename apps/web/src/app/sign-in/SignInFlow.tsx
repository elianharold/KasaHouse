'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserRole } from '@kasahouse/shared-types';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { useRequestOtp, useSession, useVerifyOtp } from '@/hooks/use-auth';
import { toApiError } from '@/lib/api-error';
import { cn } from '@/lib/utils';

const phoneSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^(?:\+233\d{9}|0\d{9})$/, 'Enter a Ghana mobile number, e.g. 024 123 4567.'),
});
type PhoneForm = z.infer<typeof phoneSchema>;

type Step = 'phone' | 'code' | 'role';

export function SignInFlow() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = params.get('next') || '/browse';

  const { isAuthenticated, needsRole } = useSession();
  const requestOtp = useRequestOtp();
  const verifyOtp = useVerifyOtp();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [maskedPhone, setMaskedPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | undefined>();
  const [role, setRole] = useState<UserRole | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const phoneForm = useForm<PhoneForm>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  });

  // Redirect out once the session is complete.
  useEffect(() => {
    if (isAuthenticated && !needsRole) router.replace(nextUrl);
    else if (isAuthenticated && needsRole) setStep('role');
  }, [isAuthenticated, needsRole, nextUrl, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const sendCode = phoneForm.handleSubmit(async ({ phone: value }) => {
    setError(null);
    try {
      const res = await requestOtp.mutateAsync({ phone: value });
      setPhone(value);
      setChallengeId(res.challengeId);
      setMaskedPhone(res.maskedPhone);
      setDevCode(res.devCode);
      setCode(res.devCode ?? '');
      setCooldown(res.resendAfterSeconds);
      setStep('code');
    } catch (e) {
      phoneForm.setError('phone', { message: toApiError(e).message });
    }
  });

  const verify = async (withRole?: UserRole) => {
    setError(null);
    try {
      await verifyOtp.mutateAsync({ challengeId, code, role: withRole });
      // effect above handles navigation / role step
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
      const res = await requestOtp.mutateAsync({ phone });
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
        {step === 'phone' && 'Sign in or create an account'}
        {step === 'code' && 'Enter your code'}
        {step === 'role' && 'How will you use KasaHouse?'}
      </h1>

      {step === 'phone' && (
        <form onSubmit={sendCode} className="mt-6">
          <Field
            label="Phone number"
            error={phoneForm.formState.errors.phone?.message}
            hint="We'll text you a 6-digit code. Standard SMS rates may apply."
          >
            {(id) => (
              <Input
                id={id}
                type="tel"
                autoFocus
                placeholder="024 123 4567"
                invalid={!!phoneForm.formState.errors.phone}
                {...phoneForm.register('phone')}
              />
            )}
          </Field>
          <Button type="submit" fullWidth loading={requestOtp.isPending}>
            Send code
          </Button>
        </form>
      )}

      {step === 'code' && (
        <div className="mt-6">
          <p className="text-sm text-ink-muted">
            Sent to {maskedPhone}.{' '}
            <button
              type="button"
              className="font-medium text-brand-dark underline"
              onClick={() => setStep('phone')}
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
            loading={verifyOtp.isPending}
            disabled={code.length < 4}
            onClick={() => verify()}
          >
            Verify &amp; continue
          </Button>

          <button
            type="button"
            onClick={resend}
            disabled={cooldown > 0 || requestOtp.isPending}
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
            loading={verifyOtp.isPending}
            onClick={() => role && verify(role)}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}
