import { Suspense } from 'react';
import type { Metadata } from 'next';
import { VerifyIdClient } from './VerifyIdClient';

export const metadata: Metadata = {
  title: 'Verify your Ghana Card',
  robots: { index: false },
};

export default function VerifyIdPage() {
  return (
    <Suspense fallback={null}>
      <VerifyIdClient />
    </Suspense>
  );
}
