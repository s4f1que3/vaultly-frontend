export default function DecommissionedPage() {
  return (
    <main
      style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
      className="flex min-h-screen flex-col items-center justify-center px-6 text-center"
    >
      <div
        style={{
          backgroundColor: 'var(--color-accent-dim)',
          color: 'var(--color-accent)',
        }}
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
      >
        ⚠
      </div>
      <h1 className="text-2xl font-semibold sm:text-3xl">
        This site has been temporarily decommissioned by the owner.
      </h1>
      <p
        style={{ color: 'var(--color-text-secondary)' }}
        className="mt-3 max-w-md text-sm sm:text-base"
      >
        We&apos;re not available right now. Please check back later.
      </p>
    </main>
  );
}
