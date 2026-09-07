import type { Metadata } from 'next';
import {
  API_ROUTES,
  toPesewas,
  type ListingSummary,
  type PaginatedResult,
} from '@kasahouse/shared-types';
import { serverFetch } from '@/lib/api/server';
import { Container } from '@/components/layout/Container';
import { FilterPanel } from '@/components/listings/FilterPanel';
import { ListingsView } from '@/components/listings/ListingsView';
import { ErrorState } from '@/components/ui/States';

export const metadata: Metadata = {
  title: 'Browse rentals and properties for sale in Ghana',
  description:
    'Every KasaHouse listing — filter by city, price, property type and bedrooms. Deal directly with the owner.',
};

export const revalidate = 60;

type SearchParams = Record<string, string | string[] | undefined>;

function buildQuery(sp: SearchParams): string {
  const p = new URLSearchParams();
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

  const pass = ['purpose', 'propertyType', 'city', 'area', 'q', 'sort', 'minBedrooms'];
  for (const key of pass) {
    const val = first(sp[key]);
    if (val) p.set(key, val);
  }
  const minPrice = first(sp.minPrice);
  const maxPrice = first(sp.maxPrice);
  if (minPrice && !Number.isNaN(Number(minPrice))) p.set('minPrice', String(toPesewas(Number(minPrice))));
  if (maxPrice && !Number.isNaN(Number(maxPrice))) p.set('maxPrice', String(toPesewas(Number(maxPrice))));
  if (!p.has('sort')) p.set('sort', 'newest');
  p.set('pageSize', '12');
  return p.toString();
}

export default async function BrowsePage({
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
      <h1 className="mb-4 text-2xl font-semibold text-ink">Browse listings</h1>
      <FilterPanel />
      <div className="mt-6">
        {failed ? (
          <ErrorState error={new Error('Could not load listings. The API may be starting up.')} />
        ) : (
          <ListingsView initialData={initial} />
        )}
      </div>
    </Container>
  );
}
