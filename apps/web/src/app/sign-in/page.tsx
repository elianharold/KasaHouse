import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Container } from '@/components/layout/Container';
import { SignInFlow } from './SignInFlow';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false },
};

export default function SignInPage() {
  return (
    <Container size="narrow" className="py-12 sm:py-20">
      <Suspense fallback={null}>
        <SignInFlow />
      </Suspense>
    </Container>
  );
}
