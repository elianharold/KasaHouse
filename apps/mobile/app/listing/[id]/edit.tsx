import { Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Screen } from '../../../src/components/ui/Screen';
import { ErrorState, LoadingState } from '../../../src/components/ui/StateViews';
import { ListingForm } from '../../../src/features/listing-form/ListingForm';
import {
  fromListing,
  toUpsertPayload,
} from '../../../src/features/listing-form/schema';
import { useListing } from '../../../src/hooks/use-listings';
import { useUpdateListing } from '../../../src/hooks/use-listing-mutations';
import { toApiError } from '../../../src/lib/api-error';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: listing, isLoading, isError, error, refetch } = useListing(id);
  const updateListing = useUpdateListing(id ?? '');

  return (
    <>
      <Stack.Screen options={{ title: 'Edit listing' }} />
      <Screen scroll>
        {isLoading ? (
          <LoadingState />
        ) : isError || !listing ? (
          <ErrorState error={error} onRetry={() => void refetch()} />
        ) : (
          <ListingForm
            defaultValues={fromListing(listing)}
            submitLabel="Save changes"
            submitting={updateListing.isPending}
            onSubmit={async (values) => {
              try {
                await updateListing.mutateAsync(toUpsertPayload(values));
                router.back();
              } catch (err) {
                Alert.alert('Could not save changes', toApiError(err).message);
              }
            }}
          />
        )}
      </Screen>
    </>
  );
}
