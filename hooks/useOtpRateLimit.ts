import { useCallback, useEffect, useState } from 'react';

const MAX_ATTEMPTS  = 5;
const COOLDOWN_MS   = 60_000;        // 60 seconds between resends
const LOCKOUT_MS    = 15 * 60_000;   // 15-minute lockout after 5 attempts

interface Stored {
  count: number;
  lastAt: number;      // ms timestamp of most recent request
  lockedUntil: number; // ms timestamp; 0 = not locked
}

function storageKey(email: string) {
  return `otp_limit_${email.toLowerCase().trim()}`;
}

function read(email: string): Stored {
  if (!email) return { count: 0, lastAt: 0, lockedUntil: 0 };
  try {
    const raw = localStorage.getItem(storageKey(email));
    return raw ? (JSON.parse(raw) as Stored) : { count: 0, lastAt: 0, lockedUntil: 0 };
  } catch {
    return { count: 0, lastAt: 0, lockedUntil: 0 };
  }
}

function write(email: string, data: Stored) {
  if (!email) return;
  localStorage.setItem(storageKey(email), JSON.stringify(data));
}

export function useOtpRateLimit(email: string) {
  // Tick every second to drive countdowns
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const now     = Date.now();
  const stored  = read(email);

  const isLockedOut       = stored.lockedUntil > now;
  const lockoutSeconds    = isLockedOut ? Math.ceil((stored.lockedUntil - now) / 1000) : 0;
  const lockoutMinutes    = Math.floor(lockoutSeconds / 60);
  const lockoutRemSeconds = lockoutSeconds % 60;

  const cooldownSeconds = !isLockedOut && stored.lastAt > 0
    ? Math.max(0, Math.ceil((stored.lastAt + COOLDOWN_MS - now) / 1000))
    : 0;

  const canResend    = !isLockedOut && cooldownSeconds === 0 && stored.count > 0;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - stored.count);

  // Call once per successful OTP send (including the very first one).
  // Pass emailOverride when calling right after a setState (before re-render).
  const recordRequest = useCallback((emailOverride?: string) => {
    const target = emailOverride ?? email;
    const s      = read(target);
    const count  = s.count + 1;
    write(target, {
      count,
      lastAt:      Date.now(),
      lockedUntil: count >= MAX_ATTEMPTS ? Date.now() + LOCKOUT_MS : 0,
    });
    setTick(t => t + 1);
  }, [email]);

  // Clear stored state (call after successful verification or when email changes)
  const clear = useCallback(() => {
    if (email) localStorage.removeItem(storageKey(email));
    setTick(t => t + 1);
  }, [email]);

  return {
    canResend,
    cooldownSeconds,
    isLockedOut,
    lockoutMinutes,
    lockoutRemSeconds,
    lockoutSeconds,
    attemptsLeft,
    attemptsUsed: stored.count,
    recordRequest,
    clear,
  };
}
