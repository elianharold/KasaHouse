import Link from 'next/link';
import { Container } from './Container';

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line bg-surface-sunken">
      <Container className="flex flex-col gap-2 py-8 text-sm text-ink-muted sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} KasaHouse — direct rentals and sales, no agent fees.</p>
        <div className="flex gap-4">
          <Link href="/browse" className="hover:text-ink">
            Browse
          </Link>
          <Link href="/sign-in" className="hover:text-ink">
            List a property
          </Link>
        </div>
      </Container>
    </footer>
  );
}
