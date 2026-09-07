import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { API_ROUTES, type Listing } from '@kasahouse/shared-types';
import { serverFetch } from '@/lib/api/server';
import { ApiError } from '@/lib/api-error';
import { Container } from '@/components/layout/Container';
import { BackButton } from '@/components/ui/BackButton';
import { PurposeBadge } from '@/components/ui/Badge';
import { Gallery } from '@/components/listings/Gallery';
import { ContactPanel } from '@/components/listings/ContactPanel';
import {
  bedroomLabel,
  formatGhs,
  formatPrice,
  propertyTypeLabel,
} from '@/lib/format';

export const revalidate = 60;

async function getListing(id: string): Promise<Listing | null> {
  try {
    return await serverFetch<Listing>(API_ROUTES.listings.byId(id), { revalidate: 60 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const listing = await getListing(id).catch(() => null);
  if (!listing) return { title: 'Listing not found' };

  const priceText = formatPrice(listing.price, listing.purpose, listing.rentPeriod);
  return {
    title: `${listing.title} — ${priceText}`,
    description: listing.description.slice(0, 155),
    openGraph: {
      title: listing.title,
      description: `${priceText} · ${listing.location.area}, ${listing.location.city}`,
      images: listing.media.find((m) => m.type === 'IMAGE')?.url
        ? [{ url: listing.media.find((m) => m.type === 'IMAGE')!.url }]
        : undefined,
    },
  };
}

export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) notFound();

  const beds = bedroomLabel(listing.bedrooms);
  const baths =
    listing.bathrooms != null
      ? `${listing.bathrooms} bath${listing.bathrooms === 1 ? '' : 's'}`
      : null;

  return (
    <Container className="py-8">
      <BackButton fallbackHref="/browse" label="Back to listings" className="mb-4" />
      <div className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <Gallery media={listing.media} title={listing.title} />

          <div className="mt-6">
            <div className="flex items-center gap-3">
              <PurposeBadge purpose={listing.purpose} />
              <p className="text-2xl font-bold text-brand">
                {formatPrice(listing.price, listing.purpose, listing.rentPeriod)}
              </p>
            </div>
            <h1 className="mt-1 text-xl font-semibold text-ink">{listing.title}</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {listing.location.area}, {listing.location.city}
              {listing.location.landmark ? ` · ${listing.location.landmark}` : ''}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
              <span>{propertyTypeLabel(listing.propertyType)}</span>
              {beds ? <span>{beds}</span> : null}
              {baths ? <span>{baths}</span> : null}
              {listing.purpose === 'RENT' && listing.advanceMonths ? (
                <span>{listing.advanceMonths} months advance</span>
              ) : null}
            </div>

            <section className="mt-6">
              <h2 className="text-base font-semibold text-ink">About this place</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-ink">
                {listing.description}
              </p>
            </section>

            {listing.requirements.length > 0 ? (
              <section className="mt-6">
                <h2 className="text-base font-semibold text-ink">Requirements</h2>
                <ul className="mt-2 list-inside list-disc space-y-1 text-[15px] text-ink">
                  {listing.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {listing.addOns.length > 0 ? (
              <section className="mt-6">
                <h2 className="text-base font-semibold text-ink">Add-ons</h2>
                <ul className="mt-2 space-y-1 text-[15px]">
                  {listing.addOns.map((addOn, i) => (
                    <li key={i} className="flex justify-between">
                      <span className="text-ink">{addOn.label}</span>
                      <span className="text-ink-muted">
                        {addOn.price == null ? 'Included' : formatGhs(addOn.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        </div>

        <aside className="lg:sticky lg:top-20 lg:self-start">
          <ContactPanel listing={listing} />
        </aside>
      </div>
    </Container>
  );
}
