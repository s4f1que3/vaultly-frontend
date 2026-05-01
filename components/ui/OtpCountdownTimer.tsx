'use client';

const RADIUS = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const TOTAL = 60;

interface Props {
  seconds: number; // seconds remaining in cooldown (0–60)
}

export default function OtpCountdownTimer({ seconds }: Props) {
  const progress = Math.max(0, seconds) / TOTAL;
  const offset   = CIRCUMFERENCE * (1 - progress);

  return (
    <span className="inline-flex items-center gap-2">
      {/* Circular arc */}
      <svg width="36" height="36" className="-rotate-90">
        {/* Track */}
        <circle
          cx="18" cy="18" r={RADIUS}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="2.5"
        />
        {/* Progress arc */}
        <circle
          cx="18" cy="18" r={RADIUS}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.9s linear' }}
        />
        {/* Seconds label — un-rotate so text reads normally */}
        <text
          x="18" y="18"
          textAnchor="middle"
          dominantBaseline="central"
          className="rotate-90"
          style={{
            transform: 'rotate(90deg)',
            transformOrigin: '18px 18px',
            fill: 'var(--color-text-primary)',
            fontSize: '9px',
            fontWeight: 600,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {seconds}
        </text>
      </svg>
      <span className="text-xs text-[var(--color-text-muted)]">
        Resend in <span className="tabular-nums font-medium text-[var(--color-text-primary)]">{seconds}s</span>
      </span>
    </span>
  );
}
