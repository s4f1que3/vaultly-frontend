import type { Metadata } from 'next';
import './globals.css';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://vaultly.app';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Vaultly — Personal Budget Tracker & Finance App',
    template: '%s | Vaultly',
  },
  description:
    'Vaultly is a premium personal finance app to track expenses, set budgets, manage savings goals, and understand your spending — all in one place.',
  keywords: [
    'budgeting app',
    'personal finance app',
    'budget tracker',
    'expense tracker',
    'money management app',
    'savings goals',
    'spending tracker',
    'financial goals app',
    'vaultly',
    'budget planner',
    'transaction tracker',
    'finance app',
    'budgeting',
    'budgeting apps',
    'personal budgeting',
  ],
  authors: [{ name: 'Vaultly', url: siteUrl }],
  creator: 'Vaultly',
  publisher: 'Vaultly',
  category: 'finance',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    siteName: 'Vaultly',
    title: 'Vaultly — Personal Budget Tracker & Finance App',
    description:
      'Track expenses, set budgets, manage savings goals, and understand your spending — all in one place.',
    url: siteUrl,
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'Vaultly — Personal Finance App',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vaultly — Personal Budget Tracker & Finance App',
    description:
      'Track expenses, set budgets, manage savings goals, and understand your spending — all in one place.',
    images: ['/opengraph-image'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/logo.png',
  },
  alternates: {
    canonical: siteUrl,
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebSite',
      '@id': `${siteUrl}/#website`,
      url: siteUrl,
      name: 'Vaultly',
      description: 'Personal budget tracker and finance app',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${siteUrl}/#app`,
      name: 'Vaultly',
      description:
        'Premium personal finance app to track expenses, set budgets, manage savings goals, and understand your spending.',
      applicationCategory: 'FinanceApplication',
      operatingSystem: 'Web',
      url: siteUrl,
      offers: [
        {
          '@type': 'Offer',
          name: 'Monthly Plan',
          price: '8.00',
          priceCurrency: 'USD',
          description: 'Full access, billed monthly — cancel anytime',
        },
        {
          '@type': 'Offer',
          name: 'Yearly Plan',
          price: '100.00',
          priceCurrency: 'USD',
          description: 'Full access, billed once per year — save $16',
        },
        {
          '@type': 'Offer',
          name: 'Lifetime License',
          price: '400.00',
          priceCurrency: 'USD',
          description: 'One-time payment, unlimited access forever',
        },
      ],
      featureList: [
        'Transaction tracking',
        'Smart budget alerts',
        'Financial goals & milestones',
        'Advanced analytics & charts',
        'Card management',
        'Push notifications',
        'Spending insights',
        'Monthly & yearly summaries',
      ],
    },
    {
      '@type': 'Organization',
      '@id': `${siteUrl}/#organization`,
      name: 'Vaultly',
      url: siteUrl,
      logo: `${siteUrl}/logo.png`,
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
