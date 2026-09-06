'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ListingPurpose, PropertyType } from '@kasahouse/shared-types';
import { PROPERTY_TYPE_LABELS } from '@/lib/format';
import { Select } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];

export function FiltersBar({ showKeyword = false }: { showKeyword?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      next.delete('page');
      startTransition(() => {
        router.replace(`${pathname}?${next.toString()}`, { scroll: false });
      });
    },
    [params, pathname, router],
  );

  const purpose = params.get('purpose') ?? '';
  const propertyType = params.get('propertyType') ?? '';
  const minBedrooms = params.get('minBedrooms') ?? '';
  const sort = params.get('sort') ?? 'newest';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-3',
        pending && 'opacity-60',
      )}
    >
      {showKeyword ? (
        <input
          defaultValue={params.get('q') ?? ''}
          placeholder="Search area, type, keyword…"
          onKeyDown={(e) => {
            if (e.key === 'Enter') set({ q: (e.target as HTMLInputElement).value });
          }}
          onBlur={(e) => set({ q: e.target.value })}
          className="min-w-48 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
      ) : null}

      <Select
        value={purpose}
        onChange={(e) => set({ purpose: e.target.value || undefined })}
        className="w-auto"
        aria-label="Purpose"
      >
        <option value="">Rent or buy</option>
        <option value={ListingPurpose.RENT}>For rent</option>
        <option value={ListingPurpose.SALE}>For sale</option>
      </Select>

      <Select
        value={propertyType}
        onChange={(e) => set({ propertyType: e.target.value || undefined })}
        className="w-auto"
        aria-label="Property type"
      >
        <option value="">Any type</option>
        {PROPERTY_TYPES.map((t) => (
          <option key={t} value={t}>
            {PROPERTY_TYPE_LABELS[t]}
          </option>
        ))}
      </Select>

      <Select
        value={minBedrooms}
        onChange={(e) => set({ minBedrooms: e.target.value || undefined })}
        className="w-auto"
        aria-label="Bedrooms"
      >
        <option value="">Any beds</option>
        {['1', '2', '3', '4'].map((n) => (
          <option key={n} value={n}>
            {n}+ beds
          </option>
        ))}
      </Select>

      <Select
        value={sort}
        onChange={(e) => set({ sort: e.target.value })}
        className="ml-auto w-auto"
        aria-label="Sort"
      >
        <option value="newest">Newest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
      </Select>
    </div>
  );
}
