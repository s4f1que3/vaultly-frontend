import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Budgeting Smarter — Plans from $8/mo',
  description:
    'Get full access to Vaultly: expense tracking, smart budget alerts, savings goals, advanced analytics, and more. Monthly or yearly plans. Cancel anytime.',
  keywords: [
    'budgeting app pricing',
    'personal finance app subscription',
    'budget tracker plans',
    'vaultly pricing',
    'expense tracker subscription',
    'money management app',
  ],
  openGraph: {
    title: 'Vaultly Pricing — Budget & Finance App',
    description:
      'Full access to expense tracking, smart budgets, savings goals, and advanced analytics. Starting at $8/month.',
    url: '/subscribe',
    type: 'website',
  },
  twitter: {
    title: 'Vaultly Pricing — Budget & Finance App',
    description:
      'Full access to expense tracking, smart budgets, savings goals, and advanced analytics. Starting at $8/month.',
  },
  alternates: {
    canonical: '/subscribe',
  },
};

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
