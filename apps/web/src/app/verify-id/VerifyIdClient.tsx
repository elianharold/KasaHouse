'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShieldCheck, Clock, XCircle } from 'lucide-react';
import { KycIdType } from '@kasahouse/shared-types';
import { Container } from '@/components/layout/Container';
import { BackButton } from '@/components/ui/BackButton';
import { Button } from '@/components/ui/Button';
import { Field, Input } from '@/components/ui/Field';
import { Spinner } from '@/components/ui/States';
import { KycBadge } from '@/components/ui/Badge';
import { useSession } from '@/hooks/use-auth';
import { useKycStatus, useSubmitKyc } from '@/hooks/use-kyc';
import { toApiError } from '@/lib/api-error';

export function VerifyIdClient() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next');
  const { hydrated, isAuthenticated } = useSession();
  const status = useKycStatus();
  const submit = useSubmitKyc();

  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && !isAuthenticated) router.replace('/sign-in?next=/verify-id');
  }, [hydrated, isAuthenticated, router]);

  if (!hydrated || status.isLoading) {
    return (
      <Container className="py-10">
        <Spinner label="Loading…" />
      </Container>
    );
  }

  const s = status.data;

  const onSubmit = async () => {
    setError(null);
    try {
      const res = await submit.mutateAsync({
        idType: KycIdType.GHANA_CARD,
        idNumber: idNumber.trim(),
        fullName: fullName.trim(),
        dateOfBirth: dob,
      });
      if (res.status === 'VERIFIED' && next) router.replace(next);
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  return (
    <Container size="narrow" className="py-10">
      <BackButton fallbackHref="/browse" className="mb-4" />
      <h1 className="text-2xl font-semibold text-ink">Verify your Ghana Card</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Owners only unlock their contact and chat for verified people. Your ID
        details are checked, and only the last 4 digits are stored.
      </p>

      <div className="mt-4">
        <KycBadge status={s?.status ?? 'UNVERIFIED'} />
      </div>

      {s?.status === 'VERIFIED' ? (
        <StatusCard
          icon={<ShieldCheck className="size-6 text-brand" />}
          title="You're verified"
          body="You can now message owners and unlock contact details."
          action={<Button onClick={() => router.replace(next ?? '/browse')}>Continue</Button>}
        />
      ) : s?.status === 'PENDING' ? (
        <StatusCard
          icon={<Clock className="size-6 text-amber-600" />}
          title="Under review"
          body="We're checking your submission. This usually takes a few minutes — you'll see the result here."
        />
      ) : (
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            void onSubmit();
          }}
        >
          {s?.status === 'REJECTED' && s.latest?.rejectionReason ? (
            <div className="mb-4 flex gap-2 rounded-xl bg-red-50 p-3 text-sm text-danger">
              <XCircle className="size-4 shrink-0" />
              <span>{s.latest.rejectionReason} You can submit again below.</span>
            </div>
          ) : null}

          <Field label="Ghana Card number" hint="Format: GHA-123456789-0">
            {(id) => (
              <Input
                id={id}
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value.toUpperCase())}
                placeholder="GHA-123456789-0"
                autoFocus
              />
            )}
          </Field>
          <Field label="Full name (as on the card)">
            {(id) => (
              <Input id={id} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            )}
          </Field>
          <Field label="Date of birth">
            {(id) => (
              <Input id={id} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
            )}
          </Field>

          {error ? <p className="mb-3 text-sm text-danger">{error}</p> : null}

          <Button
            type="submit"
            fullWidth
            loading={submit.isPending}
            disabled={!idNumber || !fullName || !dob}
          >
            Submit for verification
          </Button>
          <p className="mt-3 text-center text-xs text-ink-faint">
            Photo capture (front of card + selfie) is added with the Smile ID
            integration. For now this checks the details you enter.
          </p>
        </form>
      )}
    </Container>
  );
}

function StatusCard({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mt-6 rounded-2xl border border-line p-5">
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h2 className="font-semibold text-ink">{title}</h2>
          <p className="mt-1 text-sm text-ink-muted">{body}</p>
          {action ? <div className="mt-4">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}
