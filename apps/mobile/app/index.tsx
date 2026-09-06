import { Redirect } from 'expo-router';
import { useSession } from '../src/hooks/use-auth';
import { LoadingState } from '../src/components/ui/StateViews';
import { Screen } from '../src/components/ui/Screen';

export default function Index() {
  const { hydrated, isAuthenticated } = useSession();

  if (!hydrated) {
    return (
      <Screen>
        <LoadingState label="Starting KasaHouse…" />
      </Screen>
    );
  }

  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/phone'} />;
}
