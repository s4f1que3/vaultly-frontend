'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Footer from '@/components/ui/Footer';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, CreditCard, ArrowLeftRight, Target,
  PiggyBank, BarChart3, Bell, Settings, LogOut, RefreshCw, History, Wallet, Store
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useNotificationStore } from '@/stores/useNotificationStore';
import { useBillingStore } from '@/stores/useBillingStore';
import SubscriptionWall from '@/components/billing/SubscriptionWall';
import api from '@/lib/api';

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { href: '/merchants', icon: Store, label: 'Merchants' },
  { href: '/cards', icon: CreditCard, label: 'Cards' },
  { href: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { href: '/analytics', icon: BarChart3, label: 'Analytics' },
  { href: '/history', icon: History, label: 'History' },
  { href: '/savings', icon: Wallet, label: 'Savings' },
  { href: '/goals', icon: Target, label: 'Goals' },
  { href: '/subscriptions', icon: RefreshCw, label: 'Subscriptions' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { unreadCount, fetchNotifications } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <aside className="hidden lg:flex flex-col w-[220px] min-h-screen border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-6 fixed left-0 top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-8">
        <Image src="/logo.png" alt="Vaultly" width={32} height={32} className="rounded-lg" />
        <span className="font-bold text-base text-[var(--color-text-primary)] tracking-tight">Vaultly</span>
      </Link>

      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className={`nav-item ${isActive ? 'active' : ''}`}>
              <Icon size={18} />
              <span>{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="ml-auto bg-[var(--color-accent)] text-[#0d0a06] text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleSignOut}
        className="nav-item text-[var(--color-text-muted)] hover:text-[var(--color-danger)] w-full mt-4"
      >
        <LogOut size={18} />
        <span>Sign out</span>
      </button>
    </aside>
  );
}

function MobileNav() {
  const pathname = usePathname();
  const MOBILE_ITEMS = NAV_ITEMS.slice(0, 5);
  const { unreadCount } = useNotificationStore();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-around py-2">
        {MOBILE_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all relative ${
                isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{label}</span>
              {label === 'Notifications' && unreadCount > 0 && (
                <span className="absolute top-1 right-1 bg-[var(--color-accent)] text-[#0d0a06] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { access, isChecking, fetchStatus } = useBillingStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;

    const initAccess = async () => {
      // Redeem a pending license key stored during license signup
      const pendingKey = localStorage.getItem('pending_license');
      if (pendingKey) {
        try {
          await api.post('/licenses/redeem', { license_key: pendingKey });
        } catch {
          // Already redeemed or invalid — safe to ignore, just clear it
        }
        localStorage.removeItem('pending_license');
      }
      await fetchStatus();
    };

    initAccess().catch(() => {});
  }, [fetchStatus]);

  const isSettingsPage = pathname === '/settings';

  // Only show the initial loading spinner — not on re-fetches (which keep existing access value)
  const stillChecking = !access;
  const willRedirect = !isChecking && access &&
    (access.status === 'none' || access.status === 'pending');
  const showWall = !isChecking && access &&
    !access.hasAccess && !isSettingsPage &&
    access.status !== 'none' && access.status !== 'pending';

  // Redirect — but keep showing spinner while the router.replace fires
  // so children never mount and never make blocked API calls
  useEffect(() => {
    if (willRedirect) router.replace('/subscribe');
  }, [willRedirect, router]);

  if (stillChecking || willRedirect) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-[var(--color-text-muted)]">Loading…</p>
        </div>
      </div>
    );
  }

  if (showWall) {
    return <SubscriptionWall access={access!} />;
  }

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <Sidebar />
      <main className="flex-1 lg:ml-[220px] pb-20 lg:pb-0 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {children}
          </motion.div>
        </AnimatePresence>
        <Footer />
      </main>
      <MobileNav />
    </div>
  );
}
