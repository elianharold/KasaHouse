import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { BackButton } from '@/components/ui/BackButton';
import { SignInFlow } from './SignInFlow';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <Container size="narrow" className="py-8 sm:py-14">
      <BackButton fallbackHref="/" label="Back" className="mb-6" />
      <Suspense fallback={null}>
        <SignInFlow />
      </Suspense>
    </Container>
  );
}
