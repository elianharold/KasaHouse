import { Pressable, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { Link } from 'expo-router';
import type { ListingSummary } from '@kasahouse/shared-types';
import { bedroomLabel, formatPrice, propertyTypeLabel } from '../../lib/format';
import { colors } from '../../theme/tokens';
import { ListingStatusBadge } from '../ui/Badge';

const BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function ListingCard({
  listing,
  showStatus = false,
}: {
  listing: ListingSummary;
  showStatus?: boolean;
}) {
  const beds = bedroomLabel(listing.bedrooms);

  return (
    <Link href={`/listing/${listing.id}`} asChild>
      <Pressable className="mb-4 overflow-hidden rounded-2xl border border-[#E2E8E4] bg-surface active:opacity-90">
        <View className="aspect-[4/3] w-full bg-surface-sunken">
          {listing.coverThumbnailUrl || listing.coverImageUrl ? (
            <Image
              source={{ uri: listing.coverThumbnailUrl ?? listing.coverImageUrl ?? undefined }}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
              style={{ flex: 1 }}
            />
          ) : (
            <View className="flex-1 items-center justify-center">
              <Text className="text-ink-faint">No photo yet</Text>
            </View>
          )}

          <View className="absolute left-3 top-3 flex-row">
            {listing.hasVideo ? (
              <View className="mr-2 rounded-md bg-black/60 px-2 py-0.5">
                <Text className="text-xs font-semibold text-white">▶ Video</Text>
              </View>
            ) : null}
            {listing.mediaCount > 1 ? (
              <View className="rounded-md bg-black/60 px-2 py-0.5">
                <Text className="text-xs font-semibold text-white">
                  {listing.mediaCount} photos
                </Text>
              </View>
            ) : null}
          </View>

          {showStatus ? (
            <View className="absolute right-3 top-3">
              <ListingStatusBadge status={listing.status} />
            </View>
          ) : null}
        </View>

        <View className="p-3.5">
          <Text className="text-base font-semibold text-ink" numberOfLines={1}>
            {listing.title}
          </Text>
          <Text className="mt-0.5 text-sm text-ink-muted" numberOfLines={1}>
            {listing.location.area}, {listing.location.city}
          </Text>

          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-base font-bold" style={{ color: colors.brand }}>
              {formatPrice(listing.price, listing.purpose, listing.rentPeriod)}
            </Text>
            <Text className="text-xs text-ink-muted">
              {[propertyTypeLabel(listing.propertyType), beds]
                .filter(Boolean)
                .join(' · ')}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
