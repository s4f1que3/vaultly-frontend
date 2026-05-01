import Link from 'next/link';

function LinkedInIcon({ size = 13 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--color-border)] py-5 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} Vaultly. All rights reserved.
        </p>

        <a
          href="mailto:contact@vaultly.cash"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          contact@vaultly.cash
        </a>

        <Link
          href="/terms"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        >
          Terms &amp; Conditions
        </Link>

        <a
          href="https://www.linkedin.com/in/safique-samuel-242188325/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors group"
        >
          <LinkedInIcon size={13} />
          Created by Safique Samuel
        </a>
      </div>
    </footer>
  );
}
