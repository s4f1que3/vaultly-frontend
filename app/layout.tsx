import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Vaultly — Plan, Track, Save',
  description: 'Premium personal budgeting app to plan, track, and save your money.',
  icons: {
    icon: '/favicon.ico',
    apple: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
