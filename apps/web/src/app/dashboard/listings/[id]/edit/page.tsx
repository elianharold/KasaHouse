'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ListingForm } from '@/features/listing-form/ListingForm';
import { fromListing, toUpsertPayload } from '@/features/listing-form/schema';
import { useListing } from '@/hooks/use-listings';
import { useUpdateListing } from '@/hooks/use-listing-mutations';
import { Spinner, ErrorState } from '@/components/ui/States';
import { BackButton } from '@/components/ui/BackButton';
import { toApiError } from '@/lib/api-error';

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const updateListing = useUpdateListing(id);
  const [saveError, setSaveError] = useState<string | null>(null);

  if (isLoading) return <Spinner label="Loading listing…" />;
  if (isError || !listing) return <ErrorState error={error} onRetry={() => void refetch()} />;

  return (
    <div>
      <BackButton fallbackHref={`/listings/${id}`} className="mb-3" />
      <h1 className="mb-6 text-2xl font-semibold text-ink">Edit listing</h1>
      {saveError ? (
        <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">{saveError}</p>
      ) : null}
      <ListingForm
        defaultValues={fromListing(listing)}
        submitLabel="Save changes"
        submitting={updateListing.isPending}
        onSubmit={async (values) => {
          setSaveError(null);
          try {
            await updateListing.mutateAsync(toUpsertPayload(values));
            router.push(`/listings/${id}`);
          } catch (e) {
            setSaveError(toApiError(e).message);
          }
        }}
      />
    </div>
  );
}
