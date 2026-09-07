import { useState } from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { KycIdType } from '@kasahouse/shared-types';
import { Screen } from '../src/components/ui/Screen';
import { Button } from '../src/components/ui/Button';
import { TextField } from '../src/components/ui/TextField';
import { KycBadge } from '../src/components/ui/Badge';
import { LoadingState } from '../src/components/ui/StateViews';
import { useKycStatus, useSubmitKyc } from '../src/hooks/use-kyc';
import { toApiError } from '../src/lib/api-error';

export default function VerifyIdScreen() {
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const status = useKycStatus();
  const submit = useSubmitKyc();

  const [idNumber, setIdNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState<string | null>(null);

  const s = status.data;

  const onSubmit = async () => {
    setError(null);
    try {
      const res = await submit.mutateAsync({
        idType: KycIdType.GHANA_CARD,
        idNumber: idNumber.trim(),
        fullName: fullName.trim(),
        dateOfBirth: dob.trim(),
      });
      if (res.status === 'VERIFIED') {
        if (next) router.replace(next as never);
        else router.back();
      }
    } catch (e) {
      setError(toApiError(e).message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Verify your ID' }} />
      <Screen scroll>
        {status.isLoading ? (
          <LoadingState label="Loading…" />
        ) : (
          <>
            <Text className="text-xl font-bold text-ink">Verify your Ghana Card</Text>
            <Text className="mt-2 text-sm text-ink-muted">
              Owners only open chat for verified people. Only the last 4 digits of
              your card are stored.
            </Text>
            <View className="mt-3">
              <KycBadge status={s?.status ?? 'UNVERIFIED'} />
            </View>

            {s?.status === 'VERIFIED' ? (
              <View className="mt-6 rounded-2xl border border-[#E2E8E4] p-4">
                <Text className="font-semibold text-ink">You&apos;re verified</Text>
                <Text className="mt-1 text-sm text-ink-muted">
                  You can now message owners.
                </Text>
                <Button
                  label="Continue"
                  onPress={() => (next ? router.replace(next as never) : router.back())}
                />
              </View>
            ) : s?.status === 'PENDING' ? (
              <View className="mt-6 rounded-2xl border border-[#E2E8E4] p-4">
                <Text className="font-semibold text-ink">Under review</Text>
                <Text className="mt-1 text-sm text-ink-muted">
                  We&apos;re checking your submission. The result shows here in a
                  few minutes.
                </Text>
              </View>
            ) : (
              <View className="mt-6">
                {s?.status === 'REJECTED' && s.latest?.rejectionReason ? (
                  <Text className="mb-3 rounded-xl bg-[#FBE9E7] p-3 text-sm text-danger">
                    {s.latest.rejectionReason} You can submit again below.
                  </Text>
                ) : null}

                <TextField
                  label="Ghana Card number"
                  placeholder="GHA-123456789-0"
                  autoCapitalize="characters"
                  value={idNumber}
                  onChangeText={setIdNumber}
                  hint="Format: GHA-123456789-0"
                />
                <TextField
                  label="Full name (as on the card)"
                  value={fullName}
                  onChangeText={setFullName}
                />
                <TextField
                  label="Date of birth"
                  placeholder="YYYY-MM-DD"
                  value={dob}
                  onChangeText={setDob}
                />

                {error ? (
                  <Text className="mb-3 text-sm text-danger">{error}</Text>
                ) : null}

                <Button
                  label="Submit for verification"
                  loading={submit.isPending}
                  disabled={!idNumber || !fullName || !dob}
                  onPress={onSubmit}
                />
                <Text className="mt-3 text-center text-xs text-ink-faint">
                  Camera capture of the card + a selfie is added with the Smile ID
                  integration.
                </Text>
              </View>
            )}
          </>
        )}
      </Screen>
    </>
  );
}
