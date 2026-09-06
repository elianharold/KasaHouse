'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/Field';

export function PriceCityFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const commit = useCallback(
    (patch: Record<string, string | undefined>) => {
      const next = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v) next.set(k, v);
        else next.delete(k);
      }
      next.delete('page');
      startTransition(() => router.replace(`${pathname}?${next.toString()}`, { scroll: false }));
    },
    [params, pathname, router],
  );

  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Input
        defaultValue={params.get('city') ?? ''}
        placeholder="City / town (e.g. Accra)"
        onBlur={(e) => commit({ city: e.target.value || undefined })}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit({ city: (e.target as HTMLInputElement).value || undefined });
        }}
      />
      <Input
        type="number"
        inputMode="numeric"
        defaultValue={params.get('minPrice') ?? ''}
        placeholder="Min price (GH₵)"
        onBlur={(e) => commit({ minPrice: e.target.value || undefined })}
      />
      <Input
        type="number"
        inputMode="numeric"
        defaultValue={params.get('maxPrice') ?? ''}
        placeholder="Max price (GH₵)"
        onBlur={(e) => commit({ maxPrice: e.target.value || undefined })}
      />
    </div>
  );
}
