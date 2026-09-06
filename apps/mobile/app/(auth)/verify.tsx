import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useRequestOtp, useVerifyOtp } from '../../src/hooks/use-auth';
import { toApiError } from '../../src/lib/api-error';

export default function VerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone: string;
    challengeId: string;
    maskedPhone: string;
    resendAfter: string;
    devCode?: string;
  }>();

  const verifyOtp = useVerifyOtp();
  const requestOtp = useRequestOtp();

  const [challengeId, setChallengeId] = useState(params.challengeId);
  const [code, setCode] = useState(params.devCode ?? '');
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(Number(params.resendAfter) || 45);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const submit = async () => {
    setError(null);
    try {
      await verifyOtp.mutateAsync({ challengeId, code });
      // AuthGate handles the redirect (to tabs, or to /role for brand-new phones).
    } catch (err) {
      const apiError = toApiError(err);
      if (apiError.code === 'ROLE_REQUIRED_FOR_SIGNUP') {
        router.push({
          pathname: '/(auth)/role',
          params: { challengeId, code },
        });
        return;
      }
      setError(apiError.message);
    }
  };

  const resend = async () => {
    setError(null);
    try {
      const result = await requestOtp.mutateAsync({ phone: params.phone });
      setChallengeId(result.challengeId);
      setCooldown(result.resendAfterSeconds);
      if (result.devCode) setCode(result.devCode);
    } catch (err) {
      const apiError = toApiError(err);
      setError(apiError.message);
      if (apiError.retryAfterSeconds) setCooldown(apiError.retryAfterSeconds);
    }
  };

  return (
    <Screen scroll className="flex-1 justify-center">
      <Text className="text-2xl font-bold text-ink">Enter the code</Text>
      <Text className="mt-2 text-base text-ink-muted">
        We sent a 6-digit code to {params.maskedPhone}.
      </Text>

      <Pressable onPress={() => inputRef.current?.focus()} className="mt-8">
        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          autoFocus
          maxLength={6}
          className="rounded-xl border border-[#E2E8E4] bg-surface px-4 py-4 text-center text-2xl tracking-[8px] text-ink"
          placeholder="––––––"
        />
      </Pressable>

      {params.devCode ? (
        <Text className="mt-2 text-center text-xs text-ink-faint">
          Dev build: code auto-filled from the API ({params.devCode}).
        </Text>
      ) : null}

      {error ? (
        <Text className="mt-3 text-center text-sm text-danger">{error}</Text>
      ) : null}

      <View className="mt-6">
        <Button
          label="Verify & continue"
          loading={verifyOtp.isPending}
          disabled={code.length < 4}
          onPress={submit}
        />
      </View>

      <Pressable
        onPress={resend}
        disabled={cooldown > 0 || requestOtp.isPending}
        className="mt-6"
      >
        <Text className="text-center text-sm text-ink-muted">
          {cooldown > 0
            ? `Resend code in ${cooldown}s`
            : requestOtp.isPending
              ? 'Sending…'
              : 'Resend code'}
        </Text>
      </Pressable>

      <Pressable onPress={() => router.back()} className="mt-3">
        <Text className="text-center text-sm text-brand-dark">
          Change phone number
        </Text>
      </Pressable>
    </Screen>
  );
}
