import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import {
  usePasswordLogin,
  useRequestEmailOtp,
  useRequestOtp,
} from '../../src/hooks/use-auth';
import { toApiError } from '../../src/lib/api-error';
import { cn } from '../../src/lib/cn';

const PHONE_RE = /^(?:\+233\d{9}|0\d{9})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function SignInScreen() {
  const router = useRouter();
  const requestPhone = useRequestOtp();
  const requestEmail = useRequestEmailOtp();
  const passwordLogin = usePasswordLogin();

  const [method, setMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const goToVerify = (
    channel: 'phone' | 'email',
    destination: string,
    result: { challengeId: string; maskedDestination: string; resendAfterSeconds: number; devCode?: string },
  ) => {
    router.push({
      pathname: '/(auth)/verify',
      params: {
        channel,
        destination,
        challengeId: result.challengeId,
        masked: result.maskedDestination,
        resendAfter: String(result.resendAfterSeconds),
        devCode: result.devCode ?? '',
      },
    });
  };

  const sendCode = async () => {
    setError(null);
    try {
      if (method === 'phone') {
        if (!PHONE_RE.test(phone.trim())) {
          setError('Enter a Ghana mobile number, e.g. 024 123 4567.');
          return;
        }
        const r = await requestPhone.mutateAsync({ phone: phone.trim() });
        goToVerify('phone', phone.trim(), r);
      } else {
        if (!EMAIL_RE.test(email.trim())) {
          setError('Enter a valid email address.');
          return;
        }
        const r = await requestEmail.mutateAsync({ email: email.trim() });
        goToVerify('email', email.trim(), r);
      }
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
      setError(
        err.code === 'PASSWORD_NOT_SET'
          ? 'No password on this account yet — use an email code, then set one in your profile.'
          : err.message,
      );
    }
  };

  const busy = requestPhone.isPending || requestEmail.isPending || passwordLogin.isPending;

  return (
    <Screen scroll className="flex-1 justify-center">
      <Text className="text-3xl font-bold text-ink">KasaHouse</Text>
      <Text className="mt-2 text-base text-ink-muted">
        Rent or buy directly from landlords and owners — no agent fees.
      </Text>

      <View className="mt-8 flex-row rounded-xl border border-[#E2E8E4] p-1">
        {(['phone', 'email'] as const).map((m) => (
          <Pressable
            key={m}
            onPress={() => {
              setMethod(m);
              setError(null);
            }}
            className={cn(
              'flex-1 items-center rounded-lg py-2',
              method === m ? 'bg-brand' : '',
            )}
          >
            <Text
              className={cn(
                'text-sm font-semibold capitalize',
                method === m ? 'text-white' : 'text-ink-muted',
              )}
            >
              {m}
            </Text>
          </Pressable>
        ))}
      </View>

      <View className="mt-6">
        {method === 'phone' ? (
          <TextField
            label="Phone number"
            placeholder="024 123 4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            hint="We'll text you a code. Standard SMS rates may apply."
          />
        ) : (
          <>
            <TextField
              label="Email address"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              hint="We'll email you a 6-digit code."
            />
            {usePassword ? (
              <TextField
                label="Password"
                placeholder="Your password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            ) : null}
          </>
        )}

        {error ? (
          <Text className="mb-3 text-sm text-danger">{error}</Text>
        ) : null}

        {method === 'email' && usePassword ? (
          <Button
            label="Sign in with password"
            loading={passwordLogin.isPending}
            disabled={!password}
            onPress={signInWithPassword}
          />
        ) : (
          <Button label="Send code" loading={busy} onPress={sendCode} />
        )}

        {method === 'email' ? (
          <Pressable
            onPress={() => {
              setUsePassword((v) => !v);
              setError(null);
            }}
            className="mt-3"
          >
            <Text className="text-center text-sm text-brand-dark">
              {usePassword ? 'Use an email code instead' : 'I have a password'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Text className="mt-8 text-center text-xs text-ink-faint">
        By continuing you agree to KasaHouse&apos;s Terms and Privacy Policy.
      </Text>
    </Screen>
  );
}
