import { useRef } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { MediaType } from '@kasahouse/shared-types';
import { Screen } from '../../../src/components/ui/Screen';
import { Button } from '../../../src/components/ui/Button';
import { ErrorState, LoadingState } from '../../../src/components/ui/StateViews';
import { useListing } from '../../../src/hooks/use-listings';
import { useChangeListingStatus } from '../../../src/hooks/use-listing-mutations';
import {
  useListingMediaUpload,
} from '../../../src/hooks/use-media';
import type { LocalAsset } from '../../../src/services/media-service';
import { toApiError } from '../../../src/lib/api-error';

export default function ListingMediaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const listingId = id ?? '';

  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const { items, isUploading, upload, retry, remove } =
    useListingMediaUpload(listingId);
  const changeStatus = useChangeListingStatus(listingId);

  // Keep the picked asset around so a failed upload can be retried.
  const assetsByUri = useRef<Map<string, LocalAsset>>(new Map());

  const pick = async (kind: 'images' | 'videos') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert(
        'Permission needed',
        'Allow photo access so you can add pictures and video of your property.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: kind === 'videos' ? ['videos'] : ['images'],
      allowsMultipleSelection: kind === 'images',
      selectionLimit: 10,
      quality: 0.7,
      videoMaxDuration: 60,
    });
    if (result.canceled) return;

    const assets: LocalAsset[] = result.assets.map((a) => ({
      uri: a.uri,
      type: a.type === 'video' ? MediaType.VIDEO : MediaType.IMAGE,
      width: a.width,
      height: a.height,
      durationSeconds: a.duration ? Math.round(a.duration / 1000) : undefined,
      fileName: a.fileName ?? undefined,
    }));
    assets.forEach((asset) => assetsByUri.current.set(asset.uri, asset));
    await upload(assets);
  };

  const publish = async () => {
    try {
      await changeStatus.mutateAsync({ status: 'PUBLISHED' });
      Alert.alert('Published', 'Your listing is now live on KasaHouse.');
      router.replace(`/listing/${listingId}`);
    } catch (err) {
      Alert.alert('Could not publish', toApiError(err).message);
    }
  };

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Photos & video' }} />
        <LoadingState />
      </>
    );
  }
  if (isError || !listing) {
    return (
      <>
        <Stack.Screen options={{ title: 'Photos & video' }} />
        <ErrorState error={error} onRetry={() => void refetch()} />
      </>
    );
  }

  const totalMedia = listing.media.length;
  const pendingUploads = items.filter((i) => i.status !== 'done');

  return (
    <>
      <Stack.Screen options={{ title: 'Photos & video' }} />
      <Screen edges={['left', 'right', 'bottom']}>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text className="text-sm text-ink-muted">
            Add clear photos and a short video (up to 60s). Photos are compressed
            on your phone before upload to save data. {totalMedia}/20 added.
          </Text>

          <View className="mt-4 flex-row gap-3">
            <View className="flex-1">
              <Button
                label="Add photos"
                variant="secondary"
                onPress={() => pick('images')}
                disabled={isUploading || totalMedia >= 20}
              />
            </View>
            <View className="flex-1">
              <Button
                label="Add video"
                variant="secondary"
                onPress={() => pick('videos')}
                disabled={isUploading || totalMedia >= 20}
              />
            </View>
          </View>

          <View className="mt-5 flex-row flex-wrap">
            {listing.media.map((m) => (
              <View key={m.id} className="mb-3 mr-3">
                <Image
                  source={{ uri: m.thumbnailUrl }}
                  style={{ width: 96, height: 96, borderRadius: 12 }}
                  contentFit="cover"
                />
                {m.type === MediaType.VIDEO ? (
                  <View className="absolute left-1 top-1 rounded bg-black/60 px-1">
                    <Text className="text-[10px] text-white">▶ video</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() =>
                    Alert.alert('Remove', 'Remove this from the listing?', [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Remove',
                        style: 'destructive',
                        onPress: () => void remove(m),
                      },
                    ])
                  }
                  className="absolute -right-2 -top-2 h-6 w-6 items-center justify-center rounded-full bg-danger"
                >
                  <Text className="text-xs font-bold text-white">×</Text>
                </Pressable>
              </View>
            ))}
          </View>

          {pendingUploads.length > 0 ? (
            <View className="mt-2">
              <Text className="mb-2 text-sm font-semibold text-ink">
                Uploading
              </Text>
              {pendingUploads.map((item) => (
                <View
                  key={item.localUri}
                  className="mb-2 flex-row items-center justify-between rounded-xl border border-[#E2E8E4] p-2.5"
                >
                  <Image
                    source={{ uri: item.localUri }}
                    style={{ width: 40, height: 40, borderRadius: 8 }}
                    contentFit="cover"
                  />
                  <Text
                    className={`flex-1 px-3 text-xs ${
                      item.status === 'error' ? 'text-danger' : 'text-ink-muted'
                    }`}
                  >
                    {item.status === 'uploading'
                      ? 'Compressing & uploading…'
                      : item.error ?? 'Upload failed'}
                  </Text>
                  {item.status === 'error' ? (
                    <Pressable
                      onPress={() => {
                        const asset = assetsByUri.current.get(item.localUri);
                        if (asset) void retry(item.localUri, asset);
                      }}
                    >
                      <Text className="text-xs font-semibold text-brand-dark">
                        Retry
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}
        </ScrollView>

        <View className="border-t border-[#E2E8E4] p-4">
          {listing.status === 'PUBLISHED' ? (
            <Button label="Done" onPress={() => router.replace(`/listing/${listingId}`)} />
          ) : (
            <Button
              label="Publish listing"
              loading={changeStatus.isPending}
              disabled={totalMedia === 0 || isUploading}
              hint={
                totalMedia === 0
                  ? 'Add at least one photo to publish.'
                  : 'Your listing goes live immediately.'
              }
              onPress={publish}
            />
          )}
        </View>
      </Screen>
    </>
  );
}
