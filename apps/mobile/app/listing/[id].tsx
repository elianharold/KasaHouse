import { Alert, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ListingStatus } from '@kasahouse/shared-types';
import { Gallery } from '../../src/components/listing/Gallery';
import { Button } from '../../src/components/ui/Button';
import { ListingStatusBadge } from '../../src/components/ui/Badge';
import { ErrorState, LoadingState } from '../../src/components/ui/StateViews';
import {
  bedroomLabel,
  formatGhs,
  formatPrice,
  propertyTypeLabel,
} from '../../src/lib/format';
import { useListing } from '../../src/hooks/use-listings';
import { useChangeListingStatus } from '../../src/hooks/use-listing-mutations';
import { useSession } from '../../src/hooks/use-auth';
import { toApiError } from '../../src/lib/api-error';

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isKycVerified } = useSession();
  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const changeStatus = useChangeListingStatus(id ?? '');

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Listing' }} />
        <LoadingState />
      </>
    );
  }
  if (isError || !listing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Listing' }} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  const isOwner = user?.id === listing.ownerId;
  const beds = bedroomLabel(listing.bedrooms);
  const baths =
    listing.bathrooms != null
      ? `${listing.bathrooms} bath${listing.bathrooms === 1 ? '' : 's'}`
      : null;

  const publish = async () => {
    try {
      await changeStatus.mutateAsync({ status: 'PUBLISHED' });
    } catch (err) {
      Alert.alert('Could not publish', toApiError(err).message);
    }
  };
  const unlist = async () => {
    try {
      await changeStatus.mutateAsync({ status: 'UNLISTED' });
    } catch (err) {
      Alert.alert('Could not update', toApiError(err).message);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: propertyTypeLabel(listing.propertyType) }} />
      <ScrollView className="flex-1 bg-surface" contentContainerStyle={{ paddingBottom: 32 }}>
        <Gallery media={listing.media} />

        <View className="p-4">
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl font-bold text-brand">
              {formatPrice(listing.price, listing.purpose, listing.rentPeriod)}
            </Text>
            {isOwner ? <ListingStatusBadge status={listing.status} /> : null}
          </View>

          <Text className="mt-1 text-lg font-semibold text-ink">
            {listing.title}
          </Text>
          <Text className="mt-0.5 text-sm text-ink-muted">
            {listing.location.area}, {listing.location.city}
            {listing.location.landmark ? ` · ${listing.location.landmark}` : ''}
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-1">
            <Text className="text-sm text-ink-muted">
              {propertyTypeLabel(listing.propertyType)}
            </Text>
            {beds ? <Text className="text-sm text-ink-muted">{beds}</Text> : null}
            {baths ? <Text className="text-sm text-ink-muted">{baths}</Text> : null}
            {listing.purpose === 'RENT' && listing.advanceMonths ? (
              <Text className="text-sm text-ink-muted">
                {listing.advanceMonths} months advance
              </Text>
            ) : null}
          </View>

          <Text className="mt-5 text-base font-semibold text-ink">About this place</Text>
          <Text className="mt-1.5 text-[15px] leading-6 text-ink">
            {listing.description}
          </Text>

          {listing.requirements.length > 0 ? (
            <>
              <Text className="mt-5 text-base font-semibold text-ink">
                Requirements
              </Text>
              {listing.requirements.map((req, i) => (
                <Text key={i} className="mt-1 text-[15px] text-ink">
                  •  {req}
                </Text>
              ))}
            </>
          ) : null}

          {listing.addOns.length > 0 ? (
            <>
              <Text className="mt-5 text-base font-semibold text-ink">Add-ons</Text>
              {listing.addOns.map((addOn, i) => (
                <View key={i} className="mt-1 flex-row justify-between">
                  <Text className="text-[15px] text-ink">{addOn.label}</Text>
                  <Text className="text-[15px] text-ink-muted">
                    {addOn.price == null ? 'Included' : formatGhs(addOn.price)}
                  </Text>
                </View>
              ))}
            </>
          ) : null}

          <View className="mt-6 rounded-2xl border border-[#E2E8E4] p-4">
            <Text className="text-sm text-ink-muted">Listed by</Text>
            <Text className="mt-0.5 text-base font-semibold text-ink">
              {listing.owner.fullName ?? 'KasaHouse member'}
            </Text>
            <Text className="mt-0.5 text-xs text-ink-faint">
              Member since{' '}
              {new Date(listing.owner.memberSince).toLocaleDateString('en-GH', {
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View className="mt-6">
            {isOwner ? (
              <View className="gap-2">
                <Button
                  label="Edit details"
                  variant="secondary"
                  onPress={() => router.push(`/listing/${listing.id}/edit`)}
                />
                <Button
                  label="Manage photos & video"
                  variant="secondary"
                  onPress={() => router.push(`/listing/${listing.id}/media`)}
                />
                {listing.status === ListingStatus.PUBLISHED ? (
                  <Button
                    label="Unlist"
                    variant="ghost"
                    loading={changeStatus.isPending}
                    onPress={unlist}
                  />
                ) : (
                  <Button
                    label="Publish listing"
                    loading={changeStatus.isPending}
                    onPress={publish}
                    hint={
                      listing.media.length === 0
                        ? 'Add at least one photo first.'
                        : undefined
                    }
                    disabled={listing.media.length === 0}
                  />
                )}
              </View>
            ) : (
              <Button
                label="Request to chat"
                disabled
                hint={
                  isKycVerified
                    ? 'Direct messaging with owners opens in the next KasaHouse update.'
                    : 'Verify your Ghana Card to unlock the owner’s contact and chat. Staying on-platform protects your payment history and gives you dispute cover.'
                }
                onPress={() => undefined}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </>
  );
}
