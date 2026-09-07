'use client';

import { useCallback, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, X } from 'lucide-react';
import { ListingPurpose, PropertyType } from '@kasahouse/shared-types';
import { PROPERTY_TYPE_LABELS } from '@/lib/format';
import { Input, Select } from '@/components/ui/Field';
import { cn } from '@/lib/utils';

const PROPERTY_TYPES = Object.keys(PROPERTY_TYPE_LABELS) as PropertyType[];
const FILTER_KEYS = [
  'purpose',
  'propertyType',
  'minBedrooms',
  'city',
  'minPrice',
  'maxPrice',
] as const;

export function FilterPanel({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [open, setOpen] = useState(defaultOpen);

  const set = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete('page');
      startTransition(() =>
        router.replace(`${pathname}?${next.toString()}`, { scroll: false }),
      );
    },
    [params, pathname, router],
  );

  const activeCount = useMemo(
    () => FILTER_KEYS.filter((k) => params.get(k)).length,
    [params],
  );

  const val = (k: string) => params.get(k) ?? '';

  return (
    <div className="rounded-2xl border border-line bg-surface">
      <div className="flex items-center gap-3 p-3">
        <input
          defaultValue={val('q')}
          placeholder="Search area, type or keyword…"
          onKeyDown={(e) =>
            e.key === 'Enter' && set({ q: (e.target as HTMLInputElement).value || undefined })
          }
          onBlur={(e) => set({ q: e.target.value || undefined })}
          className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand/30"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-sm font-medium',
            open || activeCount > 0
              ? 'border-brand bg-brand-light text-brand-dark'
              : 'border-line text-ink-muted',
          )}
        >
          <SlidersHorizontal className="size-4" />
          Filters
          {activeCount > 0 ? (
            <span className="grid size-5 place-items-center rounded-full bg-brand text-xs font-bold text-white">
              {activeCount}
            </span>
          ) : null}
        </button>
        <Select
          value={val('sort') || 'newest'}
          onChange={(e) => set({ sort: e.target.value })}
          className="hidden w-auto shrink-0 sm:block"
          aria-label="Sort"
        >
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </Select>
      </div>

      {open ? (
        <div className="border-t border-line p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Select value={val('purpose')} onChange={(e) => set({ purpose: e.target.value || undefined })} aria-label="Purpose">
              <option value="">Rent or buy</option>
              <option value={ListingPurpose.RENT}>For rent</option>
              <option value={ListingPurpose.SALE}>For sale</option>
            </Select>
            <Select
              value={val('propertyType')}
              onChange={(e) => set({ propertyType: e.target.value || undefined })}
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
              value={val('minBedrooms')}
              onChange={(e) => set({ minBedrooms: e.target.value || undefined })}
              aria-label="Bedrooms"
            >
              <option value="">Any bedrooms</option>
              {['1', '2', '3', '4'].map((n) => (
                <option key={n} value={n}>
                  {n}+ bedrooms
                </option>
              ))}
            </Select>
            <Input
              defaultValue={val('city')}
              placeholder="City / town"
              onBlur={(e) => set({ city: e.target.value || undefined })}
              onKeyDown={(e) =>
                e.key === 'Enter' && set({ city: (e.target as HTMLInputElement).value || undefined })
              }
            />
            <Input
              type="number"
              inputMode="numeric"
              defaultValue={val('minPrice')}
              placeholder="Min price (GH₵)"
              onBlur={(e) => set({ minPrice: e.target.value || undefined })}
            />
            <Input
              type="number"
              inputMode="numeric"
              defaultValue={val('maxPrice')}
              placeholder="Max price (GH₵)"
              onBlur={(e) => set({ maxPrice: e.target.value || undefined })}
            />
          </div>

          <div className="mt-3 flex items-center justify-between">
            <Select
              value={val('sort') || 'newest'}
              onChange={(e) => set({ sort: e.target.value })}
              className="w-auto sm:hidden"
              aria-label="Sort"
            >
              <option value="newest">Newest first</option>
              <option value="price_asc">Price: low to high</option>
              <option value="price_desc">Price: high to low</option>
            </Select>
            {activeCount > 0 ? (
              <button
                type="button"
                onClick={() => set(Object.fromEntries(FILTER_KEYS.map((k) => [k, undefined])))}
                className="ml-auto inline-flex items-center gap-1 text-sm text-brand-dark"
              >
                <X className="size-3.5" /> Clear filters
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
