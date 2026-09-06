import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Text, View } from 'react-native';
import {
  ListingPurpose,
  PropertyType,
  RentPeriod,
} from '@kasahouse/shared-types';
import { Button } from '../../components/ui/Button';
import { ChipSelect } from '../../components/ui/Chip';
import { ControlledTextField } from '../../components/ui/TextField';
import { PROPERTY_TYPE_LABELS } from '../../lib/format';
import {
  emptyListingForm,
  listingFormSchema,
  type ListingFormValues,
} from './schema';

const toInt = (raw: string): number | null => {
  const n = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};
const toMoney = (raw: string): number => {
  const n = Number.parseFloat(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const PROPERTY_OPTIONS = (Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[]).map(
  (value) => ({ value, label: PROPERTY_TYPE_LABELS[value] }),
);

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="mb-3 mt-2 text-xs font-bold uppercase tracking-wide text-ink-faint">
      {children}
    </Text>
  );
}

export function ListingForm({
  defaultValues,
  submitLabel,
  onSubmit,
  submitting,
}: {
  defaultValues?: ListingFormValues;
  submitLabel: string;
  onSubmit: (values: ListingFormValues) => void;
  submitting: boolean;
}) {
  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: defaultValues ?? emptyListingForm,
    mode: 'onBlur',
  });

  const purpose = watch('purpose');

  return (
    <View>
      <SectionTitle>What are you listing?</SectionTitle>

      <Controller
        control={control}
        name="purpose"
        render={({ field }) => (
          <View className="mb-4">
            <ChipSelect
              options={[
                { value: ListingPurpose.RENT, label: 'For rent' },
                { value: ListingPurpose.SALE, label: 'For sale' },
              ]}
              value={field.value}
              onChange={(v) => field.onChange(v ?? ListingPurpose.RENT)}
              allowClear={false}
            />
          </View>
        )}
      />

      <Controller
        control={control}
        name="propertyType"
        render={({ field }) => (
          <View className="mb-4">
            <ChipSelect
              options={PROPERTY_OPTIONS}
              value={field.value}
              onChange={(v) => field.onChange(v ?? PropertyType.APARTMENT)}
              allowClear={false}
            />
            {errors.propertyType ? (
              <Text className="mt-1 text-xs text-danger">
                {errors.propertyType.message}
              </Text>
            ) : null}
          </View>
        )}
      />

      <SectionTitle>Details</SectionTitle>
      <ControlledTextField
        control={control}
        name="title"
        label="Title"
        placeholder="e.g. Chamber & hall self-contained at East Legon"
      />
      <ControlledTextField
        control={control}
        name="description"
        label="Description"
        placeholder="Rooms, finishing, water, power, security, access…"
        multiline
        numberOfLines={5}
        style={{ minHeight: 120, textAlignVertical: 'top' }}
      />

      <SectionTitle>Price</SectionTitle>
      <ControlledTextField
        control={control}
        name="priceCedis"
        label={purpose === ListingPurpose.SALE ? 'Sale price (GH₵)' : 'Rent (GH₵)'}
        placeholder="0"
        keyboardType="numeric"
        transform={toMoney}
      />

      {purpose === ListingPurpose.RENT ? (
        <>
          <Controller
            control={control}
            name="rentPeriod"
            render={({ field }) => (
              <View className="mb-4">
                <Text className="mb-1.5 text-sm font-medium text-ink">
                  Rent period
                </Text>
                <ChipSelect
                  options={[
                    { value: RentPeriod.MONTH, label: 'Per month' },
                    { value: RentPeriod.YEAR, label: 'Per year' },
                  ]}
                  value={field.value ?? undefined}
                  onChange={(v) => field.onChange(v ?? null)}
                  allowClear={false}
                />
                {errors.rentPeriod ? (
                  <Text className="mt-1 text-xs text-danger">
                    {errors.rentPeriod.message}
                  </Text>
                ) : null}
              </View>
            )}
          />
          <ControlledTextField
            control={control}
            name="advanceMonths"
            label="Advance required (months)"
            hint="Common in Ghana: 6–12 months"
            placeholder="12"
            keyboardType="numeric"
            transform={toInt}
          />
        </>
      ) : null}

      <SectionTitle>Size</SectionTitle>
      <View className="flex-row gap-3">
        <View className="flex-1">
          <ControlledTextField
            control={control}
            name="bedrooms"
            label="Bedrooms"
            placeholder="1"
            keyboardType="numeric"
            transform={toInt}
          />
        </View>
        <View className="flex-1">
          <ControlledTextField
            control={control}
            name="bathrooms"
            label="Bathrooms"
            placeholder="1"
            keyboardType="numeric"
            transform={toInt}
          />
        </View>
      </View>

      <SectionTitle>Location</SectionTitle>
      <ControlledTextField
        control={control}
        name="region"
        label="Region"
        placeholder="e.g. Greater Accra"
      />
      <ControlledTextField
        control={control}
        name="city"
        label="City / town"
        placeholder="e.g. Accra"
      />
      <ControlledTextField
        control={control}
        name="area"
        label="Neighbourhood / area"
        placeholder="e.g. East Legon"
      />
      <ControlledTextField
        control={control}
        name="landmark"
        label="Nearest landmark (optional)"
        placeholder="e.g. Near American House"
      />

      <SectionTitle>Tenant / buyer requirements</SectionTitle>
      <ControlledTextField
        control={control}
        name="requirementsText"
        label="One requirement per line"
        placeholder={'Working professional\nNo pets\n1 year advance'}
        multiline
        numberOfLines={4}
        style={{ minHeight: 96, textAlignVertical: 'top' }}
      />

      <View className="mt-4">
        <Button
          label={submitLabel}
          loading={submitting}
          onPress={handleSubmit(onSubmit)}
        />
        <Text className="mt-2 text-center text-xs text-ink-muted">
          You can add photos and a video, then publish, on the next screen.
        </Text>
      </View>
    </View>
  );
}
