'use client';

import { motion } from 'framer-motion';
import { Card, CardTheme } from '@/types';
import { formatCurrency, maskCardNumber, formatExpiry } from '@/lib/utils/formatters';
import { Wifi } from 'lucide-react';

const THEME_GRADIENTS: Record<CardTheme, string> = {
  green: 'linear-gradient(135deg, #0d2b0d 0%, #1a4a1a 40%, #2d5a2d 70%, #0d2b0d 100%)',
  dark: 'linear-gradient(135deg, #0d0d1a 0%, #1a1a3e 50%, #0d0d1a 100%)',
  brown: 'linear-gradient(135deg, #1a0e05 0%, #3d2010 50%, #1a0e05 100%)',
  purple: 'linear-gradient(135deg, #150530 0%, #2d0f5e 50%, #150530 100%)',
  gold: 'linear-gradient(135deg, #1a1200 0%, #3d2e00 50%, #1a1200 100%)',
};

const THEME_ACCENTS: Record<CardTheme, string> = {
  green: '#57c93c',
  dark: '#3b82f6',
  brown: '#f59e0b',
  purple: '#a855f7',
  gold: '#f59e0b',
};

interface CreditCardProps {
  card: Partial<Card>;
  mini?: boolean;
}

export default function CreditCard({ card, mini = false }: CreditCardProps) {
  const theme = card.theme || 'green';
  const accent = THEME_ACCENTS[theme];
  const gradient = THEME_GRADIENTS[theme];

  const scale = mini ? 0.7 : 1;
  const w = mini ? 280 : 380;
  const h = mini ? 180 : 220;

  return (
    <motion.div
      style={{
        width: w,
        height: h,
        background: gradient,
        borderRadius: 20,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)`,
        flexShrink: 0,
      }}
      whileHover={!mini ? { scale: 1.02, rotateY: 3 } : undefined}
      transition={{ duration: 0.3 }}
    >
      {/* Background circles */}
      <div style={{
        position: 'absolute',
        top: -60,
        right: -60,
        width: 200,
        height: 200,
        borderRadius: '50%',
        background: `rgba(255,255,255,0.03)`,
        border: `1px solid rgba(255,255,255,0.05)`,
      }} />
      <div style={{
        position: 'absolute',
        bottom: -80,
        left: -40,
        width: 240,
        height: 240,
        borderRadius: '50%',
        background: `rgba(255,255,255,0.02)`,
        border: `1px solid rgba(255,255,255,0.04)`,
      }} />

      <div style={{ padding: mini ? 20 : 28, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative' }}>
        {/* Top row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <p style={{ fontSize: mini ? 9 : 11, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>
              Balance
            </p>
            <p style={{ fontSize: mini ? 18 : 24, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
              {formatCurrency(card.balance || 0)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Wifi size={mini ? 14 : 18} color="rgba(255,255,255,0.6)" style={{ transform: 'rotate(90deg)' }} />
          </div>
        </div>

        {/* Card number */}
        <p style={{
          fontSize: mini ? 13 : 18,
          letterSpacing: mini ? '0.15em' : '0.2em',
          color: 'rgba(255,255,255,0.8)',
          fontFamily: 'monospace',
          fontWeight: 500,
        }}>
          {card.card_number ? maskCardNumber(card.card_number) : '•••• •••• •••• ••••'}
        </p>

        {/* Bottom row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: mini ? 8 : 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Card holder
            </p>
            <p style={{ fontSize: mini ? 11 : 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {card.card_holder || 'YOUR NAME'}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: mini ? 8 : 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
              Expires
            </p>
            <p style={{ fontSize: mini ? 11 : 14, color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
              {card.expiry_month && card.expiry_year
                ? formatExpiry(card.expiry_month, card.expiry_year)
                : 'MM/YY'}
            </p>
          </div>
          {/* Card network logo */}
          <div style={{ marginLeft: 12 }}>
            {card.card_type === 'visa' && (
              <span style={{ fontSize: mini ? 14 : 20, fontWeight: 900, fontStyle: 'italic', color: accent, letterSpacing: '-0.03em' }}>VISA</span>
            )}
            {card.card_type === 'mastercard' && (
              <div style={{ display: 'flex' }}>
                <div style={{ width: mini ? 20 : 28, height: mini ? 20 : 28, borderRadius: '50%', background: '#eb001b', opacity: 0.9 }} />
                <div style={{ width: mini ? 20 : 28, height: mini ? 20 : 28, borderRadius: '50%', background: '#f79e1b', opacity: 0.9, marginLeft: mini ? -10 : -14 }} />
              </div>
            )}
            {card.card_type === 'amex' && (
              <span style={{ fontSize: mini ? 10 : 14, fontWeight: 800, color: accent, letterSpacing: '0.05em' }}>AMEX</span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
