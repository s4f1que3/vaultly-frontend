import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Lifetime License — One-Time Payment of $2000',
  description:
    'Buy a Vaultly lifetime license for a single $2000 payment. Unlimited access to every feature forever — no recurring subscription, no renewal.',
  keywords: [
    'vaultly lifetime license',
    'personal finance app one-time payment',
    'budget app lifetime deal',
    'expense tracker buy once',
  ],
  openGraph: {
    title: 'Vaultly Lifetime License — Pay Once, Own It Forever',
    description:
      'One payment of $2000 for unlimited, lifetime access to Vaultly. No subscriptions, no renewals.',
    url: '/license',
    type: 'website',
  },
  alternates: {
    canonical: '/license',
  },
};

export default function LicenseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
