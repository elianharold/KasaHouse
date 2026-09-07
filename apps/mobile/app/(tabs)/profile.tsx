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
  useSetPassword,
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
  const setPasswordMut = useSetPassword();
  const logout = useLogout();

  const [name, setName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!hydrated || !user) {
    return (
      <Screen>
        <LoadingState label="Loading your profile…" />
      </Screen>
    );
  }

  const saveProfile = async () => {
    setError(null);
    try {
      await updateProfile.mutateAsync({
        fullName: name.trim(),
        ...(email.trim() && email.trim() !== user.email ? { email: email.trim() } : {}),
      });
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (err) {
      setError(toApiError(err).message);
    }
  };

  const savePassword = async () => {
    setError(null);
    try {
      await setPasswordMut.mutateAsync({
        newPassword,
        ...(user.hasPassword ? { currentPassword } : {}),
      });
      setNewPassword('');
      setCurrentPassword('');
      Alert.alert(
        'Password set',
        'You were signed out on other devices for security.',
      );
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

  const initials = (() => {
    const n = user.fullName?.trim();
    if (n) {
      const p = n.split(/\s+/).filter(Boolean);
      return (p[0]![0]! + (p[1]?.[0] ?? '')).toUpperCase();
    }
    if (user.email) return user.email[0]!.toUpperCase();
    if (user.phone) return user.phone.slice(-2);
    return '·';
  })();

  return (
    <Screen scroll>
      <View className="mb-5 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-brand">
          <Text className="text-base font-bold text-white">{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-ink" numberOfLines={1}>
            {user.fullName?.trim() || user.email || user.phone || 'Your account'}
          </Text>
          <Text className="text-xs text-ink-muted">
            {user.roles.join(' + ') || 'No role yet'}
          </Text>
        </View>
      </View>

      <View className="mt-2">
        <TextField
          label="Full name"
          placeholder="e.g. Ama Boateng"
          value={name}
          onChangeText={setName}
        />
        <TextField
          label="Email"
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
          hint={
            user.email
              ? 'Used for email sign-in codes.'
              : 'Add an email to enable email sign-in and a password.'
          }
        />
        {error ? (
          <Text className="mb-3 text-sm text-danger">{error}</Text>
        ) : null}
        <Button
          label="Save changes"
          variant="secondary"
          loading={updateProfile.isPending}
          onPress={saveProfile}
        />
      </View>

      {user.email ? (
        <View className="mt-6 rounded-2xl border border-[#E2E8E4] p-4">
          <Text className="text-sm font-semibold text-ink">
            {user.hasPassword ? 'Change password' : 'Set a password'}
          </Text>
          <Text className="mb-3 mt-1 text-xs text-ink-muted">
            Optional — sign in with just your email and password.
          </Text>
          {user.hasPassword ? (
            <TextField
              label="Current password"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
          ) : null}
          <TextField
            label="New password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
            hint="At least 8 characters."
          />
          <Button
            label={user.hasPassword ? 'Update password' : 'Set password'}
            variant="secondary"
            loading={setPasswordMut.isPending}
            disabled={newPassword.length < 8}
            onPress={savePassword}
          />
        </View>
      ) : null}

      <View className="mt-6 rounded-2xl border border-[#E2E8E4] p-4">
        <Row label="Phone" value={user.phone ?? '—'} />
        <Row label="Email" value={user.email ?? '—'} />
        <Row label="Roles" value={user.roles.join(' + ') || 'None'} />
        <View className="flex-row items-center justify-between py-3">
          <Text className="text-sm text-ink-muted">ID verification</Text>
          <KycBadge status={user.kycStatus} />
        </View>
        <Text className="mt-1 text-xs text-ink-muted">
          Tenants verify their Ghana Card before a landlord&apos;s contact details
          and chat unlock. ID verification opens in the next KasaHouse update.
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
