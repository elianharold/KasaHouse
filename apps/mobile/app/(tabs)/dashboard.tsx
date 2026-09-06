import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui/Button';
import { ListingList } from '../../src/components/listing/ListingList';
import { useMyListings } from '../../src/hooks/use-listings';

export default function DashboardScreen() {
  const router = useRouter();
  const query = useMyListings();

  return (
    <View className="flex-1 bg-surface">
      <View className="border-b border-[#E2E8E4] p-4">
        <Button
          label="+ New listing"
          onPress={() => router.push('/listing/create')}
        />
      </View>

      <ListingList
        query={query}
        showStatus
        emptyTitle="No listings yet"
        emptyMessage="Create your first listing with photos and a short video. It saves as a draft until you publish it."
      />
    </View>
  );
}
