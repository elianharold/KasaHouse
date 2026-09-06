'use client';

import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ListingPurpose,
  PropertyType,
  RentPeriod,
} from '@kasahouse/shared-types';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select, Textarea } from '@/components/ui/Field';
import { PROPERTY_TYPE_LABELS } from '@/lib/format';
import { emptyListingForm, listingFormSchema, type ListingFormValues } from './schema';

const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];

const intOrNull = (raw: string): number | null => {
  const n = Number.parseInt(raw.replace(/[^\d]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};
const money = (raw: string): number => {
  const n = Number.parseFloat(raw.replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

function SectionHeading({ children }: { children: string }) {
  return (
    <h2 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wide text-ink-faint first:mt-0">
      {children}
    </h2>
  );
}

export function ListingForm({
  defaultValues,
  submitLabel,
  submitting,
  onSubmit,
}: {
  defaultValues?: ListingFormValues;
  submitLabel: string;
  submitting: boolean;
  onSubmit: (values: ListingFormValues) => void;
}) {
  const {
    control,
    register,
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
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-2xl">
      <SectionHeading>What are you listing?</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Purpose" error={errors.purpose?.message}>
          {(id) => (
            <Select id={id} {...register('purpose')}>
              <option value={ListingPurpose.RENT}>For rent</option>
              <option value={ListingPurpose.SALE}>For sale</option>
            </Select>
          )}
        </Field>
        <Field label="Property type" error={errors.propertyType?.message}>
          {(id) => (
            <Select id={id} {...register('propertyType')}>
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {PROPERTY_TYPE_LABELS[t]}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      <SectionHeading>Details</SectionHeading>
      <Field label="Title" error={errors.title?.message}>
        {(id) => (
          <Input
            id={id}
            placeholder="e.g. Chamber & hall self-contained at East Legon"
            invalid={!!errors.title}
            {...register('title')}
          />
        )}
      </Field>
      <Field label="Description" error={errors.description?.message}>
        {(id) => (
          <Textarea
            id={id}
            placeholder="Rooms, finishing, water, power, security, access…"
            invalid={!!errors.description}
            {...register('description')}
          />
        )}
      </Field>

      <SectionHeading>Price</SectionHeading>
      <Controller
        control={control}
        name="priceCedis"
        render={({ field }) => (
          <Field
            label={purpose === ListingPurpose.SALE ? 'Sale price (GH₵)' : 'Rent (GH₵)'}
            error={errors.priceCedis?.message}
          >
            {(id) => (
              <Input
                id={id}
                inputMode="numeric"
                placeholder="0"
                invalid={!!errors.priceCedis}
                value={field.value ? String(field.value) : ''}
                onChange={(e) => field.onChange(money(e.target.value))}
                onBlur={field.onBlur}
              />
            )}
          </Field>
        )}
      />

      {purpose === ListingPurpose.RENT ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Rent period" error={errors.rentPeriod?.message}>
            {(id) => (
              <Select id={id} {...register('rentPeriod')}>
                <option value={RentPeriod.MONTH}>Per month</option>
                <option value={RentPeriod.YEAR}>Per year</option>
              </Select>
            )}
          </Field>
          <Controller
            control={control}
            name="advanceMonths"
            render={({ field }) => (
              <Field label="Advance required (months)" hint="Common in Ghana: 6–12">
                {(id) => (
                  <Input
                    id={id}
                    inputMode="numeric"
                    placeholder="12"
                    value={field.value == null ? '' : String(field.value)}
                    onChange={(e) => field.onChange(intOrNull(e.target.value))}
                    onBlur={field.onBlur}
                  />
                )}
              </Field>
            )}
          />
        </div>
      ) : null}

      <SectionHeading>Size</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2">
        <Controller
          control={control}
          name="bedrooms"
          render={({ field }) => (
            <Field label="Bedrooms">
              {(id) => (
                <Input
                  id={id}
                  inputMode="numeric"
                  placeholder="1"
                  value={field.value == null ? '' : String(field.value)}
                  onChange={(e) => field.onChange(intOrNull(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            </Field>
          )}
        />
        <Controller
          control={control}
          name="bathrooms"
          render={({ field }) => (
            <Field label="Bathrooms">
              {(id) => (
                <Input
                  id={id}
                  inputMode="numeric"
                  placeholder="1"
                  value={field.value == null ? '' : String(field.value)}
                  onChange={(e) => field.onChange(intOrNull(e.target.value))}
                  onBlur={field.onBlur}
                />
              )}
            </Field>
          )}
        />
      </div>

      <SectionHeading>Location</SectionHeading>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Region" error={errors.region?.message}>
          {(id) => <Input id={id} placeholder="Greater Accra" invalid={!!errors.region} {...register('region')} />}
        </Field>
        <Field label="City / town" error={errors.city?.message}>
          {(id) => <Input id={id} placeholder="Accra" invalid={!!errors.city} {...register('city')} />}
        </Field>
      </div>
      <Field label="Neighbourhood / area" error={errors.area?.message}>
        {(id) => <Input id={id} placeholder="East Legon" invalid={!!errors.area} {...register('area')} />}
      </Field>
      <Field label="Nearest landmark (optional)">
        {(id) => <Input id={id} placeholder="Near American House" {...register('landmark')} />}
      </Field>

      <SectionHeading>Tenant / buyer requirements</SectionHeading>
      <Field label="One requirement per line" error={errors.requirementsText?.message}>
        {(id) => (
          <Textarea
            id={id}
            placeholder={'Working professional\nNo pets\n1 year advance'}
            {...register('requirementsText')}
          />
        )}
      </Field>

      <div className="mt-6">
        <Button type="submit" loading={submitting}>
          {submitLabel}
        </Button>
        <p className="mt-2 text-xs text-ink-muted">
          Add photos and a video on the next step, then publish.
        </p>
      </div>
    </form>
  );
}
