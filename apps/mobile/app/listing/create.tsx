import { Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Screen } from '../../src/components/ui/Screen';
import { ListingForm } from '../../src/features/listing-form/ListingForm';
import { toUpsertPayload } from '../../src/features/listing-form/schema';
import { useCreateListing } from '../../src/hooks/use-listing-mutations';
import { toApiError } from '../../src/lib/api-error';

export default function CreateListingScreen() {
  const router = useRouter();
  const createListing = useCreateListing();

  return (
    <>
      <Stack.Screen options={{ title: 'New listing' }} />
      <Screen scroll>
        <ListingForm
          submitLabel="Save & add photos"
          submitting={createListing.isPending}
          onSubmit={async (values) => {
            try {
              const listing = await createListing.mutateAsync(
                toUpsertPayload(values),
              );
              router.replace(`/listing/${listing.id}/media`);
            } catch (err) {
              Alert.alert('Could not save listing', toApiError(err).message);
            }
          }}
        />
      </Screen>
    </>
  );
}
