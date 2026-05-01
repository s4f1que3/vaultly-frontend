import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Vaultly — Personal Finance App';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0d0a06',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* Subtle radial glow */}
        <div
          style={{
            position: 'absolute',
            width: 600,
            height: 600,
            background: 'radial-gradient(circle, rgba(87,201,60,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo mark + wordmark */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 28 }}>
          <div
            style={{
              width: 80,
              height: 80,
              background: '#57c93c',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 44, fontWeight: 900, color: '#0d0a06', lineHeight: 1 }}>
              V
            </span>
          </div>
          <span
            style={{
              fontSize: 80,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-3px',
              lineHeight: 1,
            }}
          >
            Vaultly
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 26,
            color: '#57c93c',
            fontWeight: 600,
            margin: 0,
            letterSpacing: 6,
            textTransform: 'uppercase',
          }}
        >
          Plan · Track · Save
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 20,
            color: 'rgba(255,255,255,0.45)',
            marginTop: 20,
            textAlign: 'center',
            maxWidth: 580,
            lineHeight: 1.5,
          }}
        >
          The premium personal finance app to take control of your money.
        </p>

        {/* Feature pills */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 36,
            flexWrap: 'wrap',
            justifyContent: 'center',
            maxWidth: 700,
          }}
        >
          {['Budgets', 'Goals', 'Analytics', 'Transactions', 'Cards'].map((f) => (
            <span
              key={f}
              style={{
                background: 'rgba(87,201,60,0.12)',
                border: '1px solid rgba(87,201,60,0.3)',
                color: '#57c93c',
                padding: '6px 16px',
                borderRadius: 999,
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              {f}
            </span>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
