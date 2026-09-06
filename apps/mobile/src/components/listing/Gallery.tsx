import { useState } from 'react';
import { Dimensions, ScrollView, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { MediaType, type Media } from '@kasahouse/shared-types';

const { width } = Dimensions.get('window');
const BLUR_HASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function Gallery({ media }: { media: Media[] }) {
  const [index, setIndex] = useState(0);

  if (media.length === 0) {
    return (
      <View
        className="items-center justify-center bg-surface-sunken"
        style={{ width, height: width * 0.75 }}
      >
        <Text className="text-ink-faint">No photos or video yet</Text>
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
        }
      >
        {media.map((item) => (
          <View key={item.id} style={{ width, height: width * 0.75 }}>
            <Image
              source={{ uri: item.type === MediaType.VIDEO ? item.thumbnailUrl : item.url }}
              placeholder={{ blurhash: BLUR_HASH }}
              contentFit="cover"
              transition={200}
              style={{ flex: 1 }}
            />
            {item.type === MediaType.VIDEO ? (
              <View className="absolute inset-0 items-center justify-center">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-black/55">
                  <Text className="text-2xl text-white">▶</Text>
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </ScrollView>

      {media.length > 1 ? (
        <View className="absolute bottom-3 w-full flex-row items-center justify-center">
          {media.map((m, i) => (
            <View
              key={m.id}
              className={`mx-0.5 h-1.5 rounded-full ${
                i === index ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
