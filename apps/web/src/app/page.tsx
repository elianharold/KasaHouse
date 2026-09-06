import Link from 'next/link';
import type { Metadata } from 'next';
import {
  API_ROUTES,
  type ListingSummary,
  type PaginatedResult,
} from '@kasahouse/shared-types';
import { serverFetch } from '@/lib/api/server';
import { Container } from '@/components/layout/Container';
import { ButtonLink } from '@/components/ui/Button';
import { ListingCard } from '@/components/listings/ListingCard';

export const metadata: Metadata = {
  title: 'KasaHouse — rent or buy directly from owners in Ghana',
};

export const revalidate = 120;

async function getFeatured(): Promise<ListingSummary[]> {
  try {
    const res = await serverFetch<PaginatedResult<ListingSummary>>(
      `${API_ROUTES.listings.browse}?pageSize=6&sort=newest`,
      { revalidate: 120 },
    );
    return res.items;
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const featured = await getFeatured();

  return (
    <>
      <section className="border-b border-line bg-brand-light/40">
        <Container className="py-16 sm:py-24">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight text-ink sm:text-5xl">
              Rent or buy directly from the owner.
            </h1>
            <p className="mt-4 text-lg text-ink-muted">
              KasaHouse connects tenants and buyers straight to landlords and
              sellers across Ghana — verified listings, in-app agreements, rent
              paid through the app, and no disproportionate agent fees.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/browse" size="lg">
                Browse listings
              </ButtonLink>
              <ButtonLink href="/sign-in" size="lg" variant="secondary">
                List your property
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-semibold text-ink">Latest listings</h2>
          <Link href="/browse" className="text-sm font-medium text-brand-dark hover:underline">
            View all
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="rounded-2xl border border-line bg-surface p-8 text-center text-sm text-ink-muted">
            Listings will appear here once the API is connected.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((listing, i) => (
              <ListingCard key={listing.id} listing={listing} priority={i < 3} />
            ))}
          </div>
        )}
      </Container>

      <Container className="pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            ['Verified people', 'Tenants and buyers verify their Ghana Card before contact details unlock.'],
            ['Everything in one place', 'Chat, sign the agreement, and pay rent without leaving the app.'],
            ['No agent fees', 'You deal directly with the owner. KasaHouse only takes a small, transparent commission on rent.'],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl border border-line bg-surface p-5">
              <h3 className="font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </Container>
    </>
  );
}
