'use client';

import { ButtonLink } from '@/components/ui/Button';
import { ListingGrid } from '@/components/listings/ListingGrid';
import { useMyListings } from '@/hooks/use-listings';

export default function DashboardPage() {
  const query = useMyListings();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-ink">My listings</h1>
        <ButtonLink href="/dashboard/listings/new">+ New listing</ButtonLink>
      </div>

      <ListingGrid
        query={query}
        showStatus
        emptyTitle="No listings yet"
        emptyMessage="Create your first listing with photos and a short video. It stays a draft until you publish it."
        emptyAction={<ButtonLink href="/dashboard/listings/new">Create a listing</ButtonLink>}
      />
    </div>
  );
}
