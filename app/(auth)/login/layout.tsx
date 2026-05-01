import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Log In',
  description:
    'Sign in to your Vaultly account to access your budgets, transactions, savings goals, and financial insights.',
  openGraph: {
    title: 'Log In — Vaultly Personal Finance App',
    description:
      'Sign in to your Vaultly account to access your budgets, transactions, savings goals, and financial insights.',
    url: '/login',
    type: 'website',
  },
  alternates: {
    canonical: '/login',
  },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
