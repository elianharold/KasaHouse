import { useState } from 'react';
import { View } from 'react-native';
import { ListingPurpose } from '@kasahouse/shared-types';
import { ChipSelect } from '../../src/components/ui/Chip';
import { ListingList } from '../../src/components/listing/ListingList';
import { useBrowseListings } from '../../src/hooks/use-listings';

export default function BrowseScreen() {
  const [purpose, setPurpose] = useState<ListingPurpose | undefined>(undefined);
  const query = useBrowseListings({ purpose, sort: 'newest' });

  return (
    <View className="flex-1 bg-surface">
      <View className="border-b border-[#E2E8E4] px-4 py-3">
        <ChipSelect
          options={[
            { value: ListingPurpose.RENT, label: 'For rent' },
            { value: ListingPurpose.SALE, label: 'For sale' },
          ]}
          value={purpose}
          onChange={setPurpose}
        />
      </View>

      <ListingList
        query={query}
        emptyTitle="No listings yet"
        emptyMessage="New places are added every day. Pull to refresh, or check back soon."
      />
    </View>
  );
}
