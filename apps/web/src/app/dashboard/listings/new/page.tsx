'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingForm } from '@/features/listing-form/ListingForm';
import { toUpsertPayload } from '@/features/listing-form/schema';
import { useCreateListing } from '@/hooks/use-listing-mutations';
import { toApiError } from '@/lib/api-error';

export default function NewListingPage() {
  const router = useRouter();
  const createListing = useCreateListing();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-ink">New listing</h1>
      <p className="mb-6 text-sm text-ink-muted">
        Save the details, then add photos and a video before publishing.
      </p>

      {error ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{error}</p>
      ) : null}

      <ListingForm
        submitLabel="Save & add photos"
        submitting={createListing.isPending}
        onSubmit={async (values) => {
          setError(null);
          try {
            const listing = await createListing.mutateAsync(toUpsertPayload(values));
            router.replace(`/dashboard/listings/${listing.id}/media`);
          } catch (e) {
            setError(toApiError(e).message);
          }
        }}
      />
    </div>
  );
}
