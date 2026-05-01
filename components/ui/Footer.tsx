import Link from 'next/link';
import { Linkedin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-[var(--color-border)] py-5 px-6">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-[var(--color-text-muted)]">
          © {new Date().getFullYear()} Vaultly. All rights reserved.
        </p>

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
          <Linkedin size={13} className="group-hover:text-[var(--color-accent)] transition-colors" />
          Created by Safique Samuel
        </a>
      </div>
    </footer>
  );
}
