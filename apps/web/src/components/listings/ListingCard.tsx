import Image from 'next/image';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';
import type { ListingSummary } from '@kasahouse/shared-types';
import { bedroomLabel, formatPrice, propertyTypeLabel } from '@/lib/format';
import { cloudinaryBlurUrl } from '@/lib/cloudinary-loader';
import { ListingStatusBadge, PurposeBadge, VerifiedTick } from '@/components/ui/Badge';

export function ListingCard({
  listing,
  showStatus = false,
  priority = false,
}: {
  listing: ListingSummary;
  showStatus?: boolean;
  priority?: boolean;
}) {
  const beds = bedroomLabel(listing.bedrooms);
  // Cards are small — start from the already-tiny thumbnail (the loader resizes
  // it further per breakpoint), only fall back to the full image if needed.
  const cover = listing.coverThumbnailUrl ?? listing.coverImageUrl;

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-line bg-surface transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full bg-surface-sunken">
        {cover ? (
          <Image
            src={cover}
            alt={listing.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={priority}
            {...(cloudinaryBlurUrl(cover)
              ? { placeholder: 'blur' as const, blurDataURL: cloudinaryBlurUrl(cover) }
              : {})}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-ink-faint">
            No photo yet
          </div>
        )}

        <div className="absolute left-3 top-3">
          <PurposeBadge purpose={listing.purpose} />
        </div>

        <div className="absolute bottom-3 left-3 flex gap-2">
          {listing.hasVideo ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
              <PlayCircle className="size-3.5" /> Video
            </span>
          ) : null}
          {listing.mediaCount > 1 ? (
            <span className="rounded-md bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">
              {listing.mediaCount} photos
            </span>
          ) : null}
        </div>

        {showStatus ? (
          <div className="absolute right-3 top-3">
            <ListingStatusBadge status={listing.status} />
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-base font-semibold text-ink">{listing.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-sm text-ink-muted">
          {listing.location.area}, {listing.location.city}
        </p>
        <VerifiedTick
          verified={listing.ownerVerified}
          size="xs"
          showUnverified
          className="mt-1.5 self-start"
        />
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-base font-bold text-brand">
            {formatPrice(listing.price, listing.purpose, listing.rentPeriod)}
          </span>
          <span className="text-xs text-ink-muted">
            {[propertyTypeLabel(listing.propertyType), beds].filter(Boolean).join(' · ')}
          </span>
        </div>
      </div>
    </Link>
  );
}
