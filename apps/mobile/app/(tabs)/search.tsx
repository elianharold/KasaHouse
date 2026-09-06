import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import {
  ListingPurpose,
  PropertyType,
  toPesewas,
  type ListingFilters,
} from '@kasahouse/shared-types';
import { Screen } from '../../src/components/ui/Screen';
import { Button } from '../../src/components/ui/Button';
import { ChipSelect } from '../../src/components/ui/Chip';
import { TextField } from '../../src/components/ui/TextField';
import { ListingList } from '../../src/components/listing/ListingList';
import { PROPERTY_TYPE_LABELS } from '../../src/lib/format';
import { useBrowseListings } from '../../src/hooks/use-listings';

const PROPERTY_OPTIONS = (Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map(
  (value) => ({ value, label: PROPERTY_TYPE_LABELS[value] }),
);
const BEDROOM_OPTIONS = ['1', '2', '3', '4'].map((v) => ({
  value: v,
  label: `${v}+ bed`,
}));

export default function SearchScreen() {
  const [purpose, setPurpose] = useState<ListingPurpose>();
  const [propertyType, setPropertyType] = useState<PropertyType>();
  const [minBeds, setMinBeds] = useState<string>();
  const [city, setCity] = useState('');
  const [q, setQ] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [applied, setApplied] = useState<ListingFilters>({ sort: 'newest' });

  const query = useBrowseListings(applied);

  const draft: ListingFilters = useMemo(
    () => ({
      sort: 'newest',
      purpose,
      propertyType,
      minBedrooms: minBeds ? Number(minBeds) : undefined,
      city: city.trim() || undefined,
      q: q.trim() || undefined,
      minPrice: minPrice ? toPesewas(Number(minPrice)) : undefined,
      maxPrice: maxPrice ? toPesewas(Number(maxPrice)) : undefined,
    }),
    [purpose, propertyType, minBeds, city, q, minPrice, maxPrice],
  );

  return (
    <Screen edges={['left', 'right']}>
      <ScrollView
        className="max-h-[62%] border-b border-[#E2E8E4]"
        contentContainerStyle={{ padding: 16 }}
        keyboardShouldPersistTaps="handled"
      >
        <TextField
          label="Keyword"
          placeholder="e.g. self-contained, East Legon"
          value={q}
          onChangeText={setQ}
        />
        <TextField
          label="City / town"
          placeholder="e.g. Accra"
          value={city}
          onChangeText={setCity}
        />

        <Text className="mb-1.5 text-sm font-medium text-ink">Purpose</Text>
        <View className="mb-4">
          <ChipSelect
            options={[
              { value: ListingPurpose.RENT, label: 'For rent' },
              { value: ListingPurpose.SALE, label: 'For sale' },
            ]}
            value={purpose}
            onChange={setPurpose}
          />
        </View>

        <Text className="mb-1.5 text-sm font-medium text-ink">Property type</Text>
        <View className="mb-4">
          <ChipSelect
            options={PROPERTY_OPTIONS}
            value={propertyType}
            onChange={setPropertyType}
          />
        </View>

        <Text className="mb-1.5 text-sm font-medium text-ink">Bedrooms</Text>
        <View className="mb-4">
          <ChipSelect
            options={BEDROOM_OPTIONS}
            value={minBeds}
            onChange={setMinBeds}
          />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label="Min price (GH₵)"
              placeholder="0"
              keyboardType="numeric"
              value={minPrice}
              onChangeText={setMinPrice}
            />
          </View>
          <View className="flex-1">
            <TextField
              label="Max price (GH₵)"
              placeholder="Any"
              keyboardType="numeric"
              value={maxPrice}
              onChangeText={setMaxPrice}
            />
          </View>
        </View>

        <Button label="Show results" onPress={() => setApplied(draft)} />
      </ScrollView>

      <View className="flex-1">
        <ListingList
          query={query}
          emptyTitle="No matches"
          emptyMessage="Try widening your price range or removing a filter."
        />
      </View>
    </Screen>
  );
}
