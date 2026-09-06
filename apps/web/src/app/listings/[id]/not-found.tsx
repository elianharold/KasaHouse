import { Container } from '@/components/layout/Container';
import { ButtonLink } from '@/components/ui/Button';

export default function ListingNotFound() {
  return (
    <Container className="py-20">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-ink">Listing not available</h1>
        <p className="mt-2 text-sm text-ink-muted">
          This listing may have been taken down or is no longer published.
        </p>
        <div className="mt-6">
          <ButtonLink href="/browse">Browse other listings</ButtonLink>
        </div>
      </div>
    </Container>
  );
}
