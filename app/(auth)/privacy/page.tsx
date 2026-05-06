import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Privacy Policy — Vaultly',
};

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Effective date: May 6, 2026 &nbsp;·&nbsp; Last updated: May 6, 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-10 text-[var(--color-text-secondary)] text-sm leading-relaxed">

          {/* 1 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              1. Overview
            </h2>
            <p>
              Vaultly (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, or the &ldquo;Service&rdquo;)
              is committed to protecting your privacy. This Privacy Policy explains how we handle
              your information when you use our personal finance management application.
            </p>
            <p>
              <span className="font-semibold text-[var(--color-text-primary)]">Important:</span> We
              do not collect, sell, share, or monetize your personal information. We do not use
              tracking technologies, analytics that identify you personally, or build user profiles
              for marketing purposes.
            </p>
          </section>

          {/* 2 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              2. What Information We Collect
            </h2>
            <p>
              We collect only the information necessary to provide you with the Vaultly service:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Account Information:</span>
                {' '}Email address, password (hashed and encrypted), and account preferences.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Financial Data:</span>
                {' '}Transactions, budgets, savings goals, card details, spending categories, and
                related financial records that you voluntarily input.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Payment Information:</span>
                {' '}Payment method details are processed by PayPal and are not stored by us.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Basic Log Data:</span>
                {' '}IP address and browser information for security and debugging purposes only.
              </li>
            </ul>
          </section>

          {/* 3 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              3. What Information We Do Not Collect
            </h2>
            <p>
              To reinforce our commitment to your privacy, we explicitly do <span className="font-semibold">not</span> collect:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Cookies or tracking identifiers for marketing or profiling purposes.</li>
              <li>Behavioral data, click-through data, or usage analytics tied to your identity.</li>
              <li>Location data or geolocation information.</li>
              <li>Device identifiers beyond what is necessary for authentication.</li>
              <li>Third-party data about you from external sources.</li>
              <li>Any personal information beyond what you explicitly provide.</li>
            </ul>
          </section>

          {/* 4 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              4. How We Use Your Information
            </h2>
            <p>
              Your information is used exclusively to:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Create and manage your account.</li>
              <li>Store and display your financial data within the app.</li>
              <li>Process your payments through PayPal.</li>
              <li>Provide customer support and respond to inquiries.</li>
              <li>Detect and prevent fraud or unauthorized access.</li>
              <li>Comply with legal obligations or court orders.</li>
            </ul>
            <p>
              Your financial data is never used for advertising, profiling, machine learning model
              training, or any purpose other than providing the core Vaultly service to you.
            </p>
          </section>

          {/* 5 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              5. Data Storage and Security
            </h2>
            <p>
              Your data is encrypted and stored on secure servers operated by Supabase, Inc. We
              implement reasonable technical and organizational security measures to protect your
              information, including encryption in transit and at rest.
            </p>
            <p>
              However, no security system is completely immune to breaches. While we take data
              protection seriously, we cannot guarantee absolute security. We will notify you
              promptly in the event of any unauthorized access or data breach affecting your account.
            </p>
            <p>
              Your financial data is associated only with your account and is not accessible to
              anyone else, including Vaultly staff, without proper authorization.
            </p>
          </section>

          {/* 6 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              6. Data Sharing and Third Parties
            </h2>
            <p>
              We do not sell, rent, trade, or share your personal or financial information with
              third parties for any reason, including marketing or data enrichment.
            </p>
            <p>
              The only exceptions are:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Payment Processing:</span>
                {' '}PayPal receives only the payment information necessary to process your
                subscription or license purchase.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Data Hosting:</span>
                {' '}Supabase stores your data on our behalf under strict confidentiality obligations.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Legal Requirements:</span>
                {' '}We may disclose information if required by law, legal process, or government request.
              </li>
            </ul>
          </section>

          {/* 7 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              7. Tracking and Analytics
            </h2>
            <p>
              Vaultly does not use third-party analytics services that track your behavior across the
              web. We do not implement Google Analytics, Mixpanel, Segment, or similar tracking tools.
            </p>
            <p>
              We do not use cookies for tracking purposes. Any non-essential cookies are only set with
              your explicit consent.
            </p>
            <p>
              For security purposes, we may log basic information (such as login attempts and IP
              addresses), but this data is not used for profiling or marketing.
            </p>
          </section>

          {/* 8 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              8. Your Rights and Control
            </h2>
            <p>
              You have full control over your information:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Access:</span>
                {' '}You can access and download your financial data at any time through your account settings.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Modification:</span>
                {' '}You can edit or delete individual transactions, goals, budgets, and other financial records.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Deletion:</span>
                {' '}You can request complete deletion of your account and all associated data at any time.
              </li>
              <li>
                <span className="text-[var(--color-text-primary)] font-medium">Data Portability:</span>
                {' '}You can request your data in a standard format to transfer to another service.
              </li>
            </ul>
          </section>

          {/* 9 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              9. Account Deletion
            </h2>
            <p>
              Upon request, we will permanently delete your account and all associated financial data
              from our systems within a reasonable timeframe. To request deletion, contact us with your
              account email address.
            </p>
            <p>
              Please note that you may not be able to recover deleted data once the deletion is
              processed. We recommend exporting your data before requesting account deletion if you
              wish to retain it.
            </p>
            <p>
              Backups and logs may retain residual data for a limited time, but this information will
              not be accessible or recoverable through the Service.
            </p>
          </section>

          {/* 10 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              10. Children&apos;s Privacy
            </h2>
            <p>
              Vaultly is not intended for or directed to individuals under the age of 18. We do not
              knowingly collect information from children. If we become aware that we have collected
              data from a minor, we will take steps to delete it immediately and terminate the child&apos;s
              account.
            </p>
          </section>

          {/* 11 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              11. International Data Transfers
            </h2>
            <p>
              Your data may be transferred to, stored in, and processed in countries outside your
              country of residence, including countries that may have different data protection laws.
              By using Vaultly, you consent to the transfer of your information to countries outside
              your country of residence.
            </p>
            <p>
              Where applicable, we implement standard contractual clauses or other appropriate
              mechanisms to ensure your data is protected during international transfers.
            </p>
          </section>

          {/* 12 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              12. Data Retention
            </h2>
            <p>
              We retain your data for as long as your account is active. Once your account is deleted
              or your subscription terminates, we retain data only as long as required by law or for
              legitimate business purposes (such as fraud prevention or accounting).
            </p>
            <p>
              You can request deletion of your data at any time, and we will process deletion requests
              within a reasonable timeframe.
            </p>
          </section>

          {/* 13 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              13. California Privacy Rights (CCPA)
            </h2>
            <p>
              If you are a California resident, you have additional rights under the California
              Consumer Privacy Act (CCPA):
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Right to know what personal information is collected and how it is used.</li>
              <li>Right to access your personal information.</li>
              <li>Right to delete your personal information (with limited exceptions).</li>
              <li>Right to opt-out of the sale or sharing of your personal information.</li>
              <li>Right to non-discrimination for exercising your CCPA rights.</li>
            </ul>
            <p>
              Since Vaultly does not sell or share personal information, and does not collect
              information for commercial purposes beyond providing the service, your CCPA rights are
              already fully protected. To exercise any of these rights, contact us.
            </p>
          </section>

          {/* 14 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              14. European Union Privacy Rights (GDPR)
            </h2>
            <p>
              If you are located in the European Economic Area, United Kingdom, or Switzerland, you
              have rights under the General Data Protection Regulation (GDPR) and equivalent laws:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Right to access your personal data.</li>
              <li>Right to rectification of inaccurate data.</li>
              <li>Right to erasure (&ldquo;right to be forgotten&rdquo;).</li>
              <li>Right to restrict processing of your data.</li>
              <li>Right to data portability.</li>
              <li>Right to object to processing.</li>
              <li>Right to withdraw consent at any time.</li>
            </ul>
            <p>
              You can exercise these rights by contacting us with your request. We will respond
              within 30 days of receiving your request.
            </p>
          </section>

          {/* 15 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              15. Changes to This Privacy Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time to reflect changes in our practices,
              technology, legal requirements, or other factors. When we make material changes, we will
              update the &ldquo;Last updated&rdquo; date at the top of this page and, where appropriate,
              notify you by email or through a notice within the Service.
            </p>
            <p>
              Your continued use of Vaultly after any changes take effect constitutes your acceptance
              of the revised Privacy Policy. If you do not agree with the updated terms, you must
              discontinue use of the Service.
            </p>
          </section>

          {/* 16 */}
          <section className="space-y-3">
            <h2 className="text-base font-semibold text-[var(--color-accent)]">
              16. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy, wish to exercise your privacy rights,
              or have concerns about how your information is handled, please contact us at:
            </p>
            <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-4 mt-4">
              <p className="font-semibold text-[var(--color-text-primary)] text-xs">
                Contact Information
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] mt-2">
                We value your privacy and will respond to all inquiries within 10 business days.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
