import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { UserRole } from '@kasahouse/shared-types';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { TextField } from '../../src/components/ui/TextField';
import { KycBadge } from '../../src/components/ui/Badge';
import { LoadingState } from '../../src/components/ui/StateViews';
import {
  useLogout,
  useSession,
  useUpdateProfile,
} from '../../src/hooks/use-auth';
import { toApiError } from '../../src/lib/api-error';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-[#EEF2F0] py-3">
      <Text className="text-sm text-ink-muted">{label}</Text>
      <Text className="text-sm font-medium text-ink">{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, hydrated, isLandlord, isTenant } = useSession();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const [name, setName] = useState(user?.fullName ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!hydrated || !user) {
    return (
      <Screen>
        <LoadingState label="Loading your profile…" />
      </Screen>
    );
  }

  const saveName = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({ fullName: name.trim() });
      Alert.alert('Saved', 'Your name has been updated.');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const addRole = async (role: UserRole) => {
    try {
      await updateProfile.mutateAsync({ addRole: role });
    } catch (err) {
      Alert.alert('Could not update', toApiError(err).message);
    }
  };

  return (
    <Screen scroll>
      <Text className="text-xl font-bold text-ink">Your account</Text>

      <View className="mt-4">
        <TextField
          label="Full name"
          placeholder="e.g. Ama Boateng"
          value={name}
          onChangeText={setName}
          error={error ?? undefined}
        />
        <Button
          label="Save name"
          variant="secondary"
          loading={updateProfile.isPending}
          onPress={saveName}
        />
      </View>

      <View className="mt-6 rounded-2xl border border-[#E2E8E4] p-4">
        <Row label="Phone" value={user.phone} />
        <Row label="Roles" value={user.roles.join(' + ') || 'None'} />
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-sm text-ink-muted">ID verification</Text>
          <KycBadge status={user.kycStatus} />
        </View>
        <Text className="mt-1 text-xs text-ink-muted">
          Tenants verify their Ghana Card before a landlord's contact details and
          chat unlock. ID verification opens in the next KasaHouse update.
        </Text>
      </View>

      {(!isLandlord || !isTenant) && (
        <View className="mt-6">
          <Text className="mb-2 text-sm font-medium text-ink">Add a role</Text>
          {!isLandlord && (
            <Pressable
              onPress={() => addRole(UserRole.LANDLORD)}
              className="mb-2 rounded-xl border border-[#E2E8E4] p-3"
            >
              <Text className="text-sm text-ink">
                Become a landlord / seller — list a property
              </Text>
            </Pressable>
          )}
          {!isTenant && (
            <Pressable
              onPress={() => addRole(UserRole.TENANT)}
              className="rounded-xl border border-[#E2E8E4] p-3"
            >
              <Text className="text-sm text-ink">
                Also look for a place as a tenant / buyer
              </Text>
            </Pressable>
          )}
        </View>
      )}

      <View className="mt-10">
        <Button
          label="Sign out"
          variant="ghost"
          onPress={() => {
            Alert.alert('Sign out', 'Sign out of KasaHouse on this device?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign out', style: 'destructive', onPress: () => void logout() },
            ]);
          }}
        />
      </View>
    </Screen>
  );
}
