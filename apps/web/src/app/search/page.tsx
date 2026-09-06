import type { Metadata } from 'next';
import {
  API_ROUTES,
  toPesewas,
  type ListingSummary,
  type PaginatedResult,
} from '@kasahouse/shared-types';
import { serverFetch } from '@/lib/api/server';
import { Container } from '@/components/layout/Container';
import { FiltersBar } from '@/components/listings/FiltersBar';
import { PriceCityFilters } from '@/components/listings/PriceCityFilters';
import { ListingsView } from '@/components/listings/ListingsView';
import { ErrorState } from '@/components/ui/States';

export const metadata: Metadata = {
  title: 'Search properties',
  description: 'Search KasaHouse by keyword, city, price range, property type and bedrooms.',
};

export const revalidate = 60;

type SearchParams = Record<string, string | string[] | undefined>;

function buildQuery(sp: SearchParams): string {
  const p = new URLSearchParams();
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  for (const key of ['purpose', 'propertyType', 'city', 'q', 'sort', 'minBedrooms']) {
    const val = first(sp[key]);
    if (val) p.set(key, val);
  }
  for (const key of ['minPrice', 'maxPrice']) {
    const val = first(sp[key]);
    if (val && !Number.isNaN(Number(val))) p.set(key, String(toPesewas(Number(val))));
  }
  if (!p.has('sort')) p.set('sort', 'newest');
  p.set('pageSize', '12');
  return p.toString();
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  let initial: PaginatedResult<ListingSummary> | undefined;
  let failed = false;
  try {
    initial = await serverFetch<PaginatedResult<ListingSummary>>(
      `${API_ROUTES.listings.browse}?${buildQuery(sp)}`,
      { revalidate: 60 },
    );
  } catch {
    failed = true;
  }

  return (
    <Container className="py-8">
      <h1 className="mb-4 text-2xl font-semibold text-ink">Search</h1>
      <FiltersBar showKeyword />
      <PriceCityFilters />
      <div className="mt-6">
        {failed ? (
          <ErrorState error={new Error('Could not load results. The API may be starting up.')} />
        ) : (
          <ListingsView initialData={initial} />
        )}
      </div>
    </Container>
  );
}
