import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Terms & Conditions — Vaultly',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] px-6 py-12">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <Link
            href="/subscribe"
            className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
          >
            <ArrowLeft size={15} />
            Back
          </Link>
          <Link href="/subscribe" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Vaultly" width={28} height={28} className="rounded-lg" />
            <span className="font-bold text-sm text-[var(--color-text-primary)]">Vaultly</span>
          </Link>
        </div>

        {/* Title */}
        <div className="mb-10 pb-8 border-b border-[var(--color-border)]">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Effective date: May 1, 2026 &nbsp;·&nbsp; Last updated: May 1, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-[var(--color-text-secondary)] text-sm leading-relaxed">

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              1. Acceptance of Terms
            </h2>
            <p>
              By creating an account, subscribing to a plan, or otherwise accessing or using Vaultly
              (&ldquo;the Service&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;),
              you agree to be bound by these Terms &amp; Conditions. If you do not agree to all of
              these terms, you may not access or use the Service.
            </p>
            <p>
              These terms constitute a legally binding agreement between you and Vaultly. By checking
              the agreement box during sign-up, you confirm that you have read, understood, and
              accepted these terms in full.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              2. Description of Service
            </h2>
            <p>
              Vaultly is a personal finance management application that allows users to track
              transactions, manage budgets, set savings goals, monitor spending, and gain insights
              into their financial activity. The Service is intended for personal, non-commercial use.
            </p>
            <p>
              Vaultly does not provide financial advice, investment recommendations, tax guidance, or
              any other regulated financial services. All data presented within the app is for
              informational and personal tracking purposes only. You should consult a qualified
              financial professional before making any financial decisions.
            </p>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              3. Account Registration
            </h2>
            <p>
              To use Vaultly, you must create an account and hold an active paid subscription or a
              valid lifetime license. You agree to provide accurate, current, and complete information
              during registration and to keep your account details up to date.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your login credentials and
              for all activity that occurs under your account. You must notify us immediately of any
              unauthorized access to or use of your account. Vaultly will not be liable for any
              losses resulting from unauthorized use of your credentials.
            </p>
            <p>
              Accounts are for individual use only and may not be shared, transferred, or sold to
              another person.
            </p>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              4. Subscriptions &amp; Payment
            </h2>
            <p>
              Access to Vaultly requires one of the following paid plans:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Monthly</span>
                {' '}— $8.00 USD per month, billed monthly and recurring until cancelled.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Yearly</span>
                {' '}— $100.00 USD per year, billed once annually and recurring until cancelled.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Lifetime License</span>
                {' '}— $2000.00 USD one-time payment granting permanent access to the Service.
              </li>
            </ul>
            <p>
              All payments are processed securely through PayPal. By subscribing, you authorize
              Vaultly to charge your selected payment method on the applicable billing cycle.
              Subscription fees are charged in advance. Prices are listed in USD and are subject to
              change with reasonable notice.
            </p>
            <p>
              Your subscription renews automatically unless you cancel before the next billing date.
              We will provide advance notice of any price changes. Continued use of the Service after
              a price change takes effect constitutes acceptance of the new pricing.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              5. Cancellations &amp; Refunds
            </h2>
            <p>
              You may cancel your subscription at any time through your account settings or by
              contacting us. Upon cancellation, your access to the Service will continue until the
              end of the current paid billing period. No refunds are issued are issued at any point in time for any reason.
              For issues with purchases, our payments are handled via paypal. This means that any issues should be forwarded to them.
            </p>
            <p>
              Lifetime licenses are non-refundable once issued, as the license key is immediately
              generated and delivered upon payment. If you have not yet redeemed your license key and
              encounter a genuine technical issue preventing delivery, please contact us within 7 days
              of purchase.
            </p>
            <p>
              If a payment fails, your account will enter a grace period. If the outstanding payment
              is not resolved before the grace period expires, access to the Service will be
              suspended until the balance is settled.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              6. Your Data &amp; Privacy
            </h2>
            <p>
              Vaultly stores your financial data (transactions, budgets, goals, cards, and related
              records) on secured servers operated by Supabase, Inc. Your data is associated with
              your account and is only accessible by you.
            </p>
            <p>
              We do not sell, share, or disclose your personal or financial data to third parties,
              except as required by law or as necessary to provide the Service (for example, payment
              processing through PayPal). We take reasonable technical measures to protect your data,
              but no system is completely secure, and we cannot guarantee absolute security.
            </p>
            <p>
              You own your data. You may request deletion of your account and associated data at any
              time by contacting us. Upon account deletion, your data will be permanently removed
              from our systems within a reasonable timeframe.
            </p>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              7. Acceptable Use
            </h2>
            <p>
              You agree to use Vaultly only for lawful personal financial tracking purposes. You
              must not:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Use the Service for any illegal activity or to violate any applicable laws.</li>
              <li>Attempt to gain unauthorized access to any part of the Service or its infrastructure.</li>
              <li>Reverse-engineer, decompile, or attempt to extract the source code of the Service.</li>
              <li>Use automated tools (bots, scrapers, crawlers) to access or interact with the Service.</li>
              <li>Impersonate another person or misrepresent your identity.</li>
              <li>Share, resell, or sublicense your account or license key to any other party.</li>
            </ul>
            <p>
              We reserve the right to immediately suspend or terminate accounts found in violation
              of this section without refund.
            </p>
          </section>

          {/* 8 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              8. Intellectual Property
            </h2>
            <p>
              All content, branding, software, design, and materials that make up Vaultly — including
              but not limited to the logo, interface, and underlying code — are the intellectual
              property of Vaultly and its creator. All rights are reserved.
            </p>
            <p>
              These terms do not grant you any ownership interest in the Service. You are granted a
              limited, non-exclusive, non-transferable license to use the Service solely for your
              personal financial tracking purposes while your subscription or license is active.
            </p>
          </section>

          {/* 9 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              9. Disclaimers
            </h2>
            <p>
              The Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without
              warranties of any kind, either express or implied. We do not warrant that the Service
              will be uninterrupted, error-free, or free of harmful components.
            </p>
            <p>
              Vaultly is a personal tracking tool. We are not responsible for any financial decisions
              made on the basis of data displayed in the app. Always verify important financial
              information with your bank or a qualified financial advisor.
            </p>
          </section>

          {/* 10 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              10. Limitation of Liability
            </h2>
            <p>
              To the fullest extent permitted by law, Vaultly and its creator shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising from
              your use of, or inability to use, the Service — including but not limited to loss of
              data, loss of revenue, or financial losses of any kind.
            </p>
            <p>
              In no event shall our total liability to you exceed the amount you paid to Vaultly in
              the twelve (12) months preceding the claim.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              11. Termination
            </h2>
            <p>
              We reserve the right to suspend or terminate your account at any time, with or without
              notice, if we reasonably believe you have violated these terms or engaged in fraudulent
              or harmful activity. Upon termination, your right to access the Service ends immediately.
            </p>
            <p>
              You may also terminate your account at any time by contacting us. Termination does not
              entitle you to a refund of any prepaid fees, except at our sole discretion.
            </p>
          </section>

          {/* 12 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              12. Changes to These Terms
            </h2>
            <p>
              We may update these Terms &amp; Conditions from time to time. When we make material
              changes, we will update the &ldquo;Last updated&rdquo; date at the top of this page
              and, where appropriate, notify you by email or through a notice within the Service.
            </p>
            <p>
              Your continued use of Vaultly after any changes take effect constitutes your acceptance
              of the revised terms. If you do not agree to the updated terms, you must stop using the
              Service and cancel your subscription.
            </p>
          </section>

          {/* 13 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              13. Governing Law
            </h2>
            <p>
              These terms are governed by and construed in accordance with applicable laws. Any
              disputes arising from these terms or your use of the Service shall be resolved through
              good-faith negotiation. If a resolution cannot be reached, disputes shall be submitted
              to binding arbitration.
            </p>
          </section>

          {/* 14 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              14. Contact
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding these Terms &amp; Conditions
              or your account, please contact us at:
            </p>
            <p className="text-[var(--color-text-primary)] font-medium">
              contact@vaultly.cash
            </p>
            <p>
              We aim to respond to all inquiries within 2 business days.
            </p>
          </section>

        </div>

        {/* Footer line */}
        <div className="mt-12 pt-8 border-t border-[var(--color-border)] text-center">
          <p className="text-xs text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Vaultly. All rights reserved.
          </p>
        </div>

      </div>
    </div>
  );
}
