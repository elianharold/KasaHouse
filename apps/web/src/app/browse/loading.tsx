import { Container } from '@/components/layout/Container';
import { Spinner } from '@/components/ui/States';

export default function Loading() {
  return (
    <Container className="py-8">
      <Spinner label="Loading listings…" />
    </Container>
  );
}
