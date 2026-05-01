'use client';

import { motion } from 'framer-motion';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: number;
  icon: LucideIcon;
  iconColor?: string;
  index?: number;
}

export default function StatCard({ label, value, subValue, trend, icon: Icon, iconColor = 'var(--color-accent)', index = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card card-hover p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <p className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${iconColor}20` }}>
          <Icon size={16} style={{ color: iconColor }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight mb-1">{value}</p>
      <div className="flex items-center gap-2">
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend >= 0 ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
        {subValue && (
          <p className="text-xs text-[var(--color-text-muted)]">{subValue}</p>
        )}
      </div>
    </motion.div>
  );
}
