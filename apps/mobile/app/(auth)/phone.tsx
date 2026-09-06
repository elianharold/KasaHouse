import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { ControlledTextField } from '../../src/components/ui/TextField';
import { useRequestOtp } from '../../src/hooks/use-auth';
import { toApiError } from '../../src/lib/api-error';

const schema = z.object({
  phone: z
    .string()
    .trim()
    .regex(
      /^(?:\+233\d{9}|0\d{9})$/,
      'Enter a Ghana mobile number, e.g. 024 123 4567.',
    ),
});
type FormValues = z.infer<typeof schema>;

export default function PhoneScreen() {
  const router = useRouter();
  const requestOtp = useRequestOtp();
  const { control, handleSubmit, setError } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: '' },
  });

  const onSubmit = handleSubmit(async ({ phone }) => {
    try {
      const result = await requestOtp.mutateAsync({ phone });
      router.push({
        pathname: '/(auth)/verify',
        params: {
          phone,
          challengeId: result.challengeId,
          maskedPhone: result.maskedPhone,
          resendAfter: String(result.resendAfterSeconds),
          expiresIn: String(result.expiresInSeconds),
          devCode: result.devCode ?? '',
        },
      });
    } catch (error) {
      const apiError = toApiError(error);
      setError('phone', { message: apiError.message });
    }
  });

  return (
    <Screen scroll className="flex-1 justify-center">
      <Text className="text-3xl font-bold text-ink">KasaHouse</Text>
      <Text className="mt-2 text-base text-ink-muted">
        Rent or buy directly from landlords and owners — no agent fees.
      </Text>

      <View className="mt-10">
        <ControlledTextField
          control={control}
          name="phone"
          label="Phone number"
          placeholder="024 123 4567"
          keyboardType="phone-pad"
          autoComplete="tel"
          autoFocus
          hint="We'll text you a code to sign in. Standard SMS rates may apply."
        />
        <Button
          label="Send code"
          loading={requestOtp.isPending}
          onPress={onSubmit}
        />
      </View>

      <Text className="mt-8 text-center text-xs text-ink-faint">
        By continuing you agree to KasaHouse's Terms and Privacy Policy.
      </Text>
    </Screen>
  );
}
