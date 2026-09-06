import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { UserRole } from '@kasahouse/shared-types';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { useUpdateProfile, useVerifyOtp, useSession } from '../../src/hooks/use-auth';
import { toApiError } from '../../src/lib/api-error';

const OPTIONS: { role: UserRole; title: string; blurb: string }[] = [
  {
    role: UserRole.TENANT,
    title: "I'm looking for a place",
    blurb: 'Browse listings, chat directly with owners, and pay rent in the app.',
  },
  {
    role: UserRole.LANDLORD,
    title: 'I have a property to list',
    blurb: 'List your property with photos and a video, and reach tenants directly.',
  },
];

export default function RoleScreen() {
  const params = useLocalSearchParams<{ challengeId?: string; code?: string }>();
  const { isAuthenticated } = useSession();
  const verifyOtp = useVerifyOtp();
  const updateProfile = useUpdateProfile();

  const [role, setRole] = useState<UserRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pending = verifyOtp.isPending || updateProfile.isPending;

  const submit = async () => {
    if (!role) return;
    setError(null);
    try {
      if (!isAuthenticated && params.challengeId && params.code) {
        // Brand-new phone: finish the sign-up with the chosen role.
        await verifyOtp.mutateAsync({
          challengeId: params.challengeId,
          code: params.code,
          role,
        });
      } else {
        // Already signed in but somehow role-less, or adding a second role.
        await updateProfile.mutateAsync({ addRole: role });
      }
      // AuthGate redirects into the app once roles are set.
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  return (
    <Screen scroll className="flex-1 justify-center">
      <Text className="text-2xl font-bold text-ink">How will you use KasaHouse?</Text>
      <Text className="mt-2 text-base text-ink-muted">
        You can switch or add the other role later in your profile.
      </Text>

      <View className="mt-8">
        {OPTIONS.map((opt) => {
          const selected = role === opt.role;
          return (
            <Pressable
              key={opt.role}
              onPress={() => setRole(opt.role)}
              className={`mb-3 rounded-2xl border p-4 ${
                selected ? 'border-brand bg-brand-light' : 'border-[#E2E8E4] bg-surface'
              }`}
            >
              <Text className="text-base font-semibold text-ink">{opt.title}</Text>
              <Text className="mt-1 text-sm text-ink-muted">{opt.blurb}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text className="mb-3 text-center text-sm text-danger">{error}</Text>
      ) : null}

      <Button
        label="Continue"
        disabled={!role}
        loading={pending}
        onPress={submit}
      />
    </Screen>
  );
}
