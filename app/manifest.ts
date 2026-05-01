import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Vaultly — Personal Finance App',
    short_name: 'Vaultly',
    description: 'Track expenses, set budgets, and manage your personal finances.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0d0a06',
    theme_color: '#57c93c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/logo.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    categories: ['finance', 'productivity', 'utilities'],
    lang: 'en',
    dir: 'ltr',
    orientation: 'portrait',
  };
}
