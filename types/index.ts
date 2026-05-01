// ─── User & Auth ───────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  currency: string;
  created_at: string;
}

// ─── Card ──────────────────────────────────────────────────────────────────────
export type CardType = 'visa' | 'mastercard' | 'amex';
export type CardTheme = 'green' | 'dark' | 'brown' | 'purple' | 'gold';

export interface Card {
  id: string;
  user_id: string;
  card_number: string;       // last 4 digits stored
  card_holder: string;
  expiry_month: string;
  expiry_year: string;
  card_type: CardType;
  theme: CardTheme;
  balance: number;
  credit_limit: number;
  is_default: boolean;
  created_at: string;
}

// ─── Transaction ───────────────────────────────────────────────────────────────
export type TransactionType = 'income' | 'expense' | 'transfer';
export type TransactionCategory =
  | 'food' | 'transport' | 'shopping' | 'entertainment' | 'health'
  | 'utilities' | 'housing' | 'education' | 'salary' | 'investment'
  | 'transfer' | 'other' | 'general';

export interface Transaction {
  id: string;
  user_id: string;
  card_id?: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  merchant?: string;
  date: string;
  created_at: string;
}

export interface TransactionFilters {
  type?: TransactionType;
  category?: TransactionCategory;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  cardId?: string;
  page?: number;
  limit?: number;
}

// ─── Budget ────────────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  user_id: string;
  category: TransactionCategory;
  limit_amount: number;
  spent_amount: number;
  period: 'monthly' | 'weekly' | 'yearly';
  alert_threshold: number; // percentage (e.g. 80)
  created_at: string;
}

// ─── Goal ──────────────────────────────────────────────────────────────────────
export type GoalStatus = 'active' | 'completed' | 'paused';

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon?: string;
  color?: string;
  status: GoalStatus;
  created_at: string;
}

// ─── Notification ──────────────────────────────────────────────────────────────
export type NotificationType = 'budget_alert' | 'goal_achieved' | 'transaction' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

// ─── Analytics ─────────────────────────────────────────────────────────────────
export interface SpendingByCategory {
  category: TransactionCategory;
  amount: number;
  percentage: number;
  color: string;
}

export interface MonthlyTrend {
  month: string;
  income: number;
  expenses: number;
  net: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

export interface AnalyticsData {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  savingsRate: number;
  spendingByCategory: SpendingByCategory[];
  monthlyTrends: MonthlyTrend[];
  dailySpending: DailySpending[];
  topMerchants: { merchant: string; amount: number; count: number }[];
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
export interface DashboardSummary {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  savingsRate: number;
  recentTransactions: Transaction[];
  budgetAlerts: Budget[];
  cards: Card[];
  upcomingBills: { description: string; amount: number; dueDate: string }[];
}

// ─── Subscription ──────────────────────────────────────────────────────────────
export type SubscriptionPeriod = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  user_id: string;
  company: string;
  amount: number;
  card_id?: string;
  period: SubscriptionPeriod;
  billing_day: number;
  billing_month?: number;
  next_due_date: string;
  last_processed_date?: string;
  is_active: boolean;
  icon?: string;
  color?: string;
  created_at: string;
}

// ─── Settings ──────────────────────────────────────────────────────────────────
export interface UserSettings {
  id: string;
  user_id: string;
  currency: string;
  notifications_enabled: boolean;
  budget_alerts: boolean;
  goal_reminders: boolean;
  weekly_summary: boolean;
  theme: 'dark' | 'light';
  language: string;
}

// ─── API Responses ─────────────────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
  message?: string;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ─── Push Notification ─────────────────────────────────────────────────────────
export interface PushSubscriptionPayload {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// ─── Intelligence — Safe-to-Spend ──────────────────────────────────────────
export interface SafeToSpend {
  safeToSpend: number;
  totalBalance: number;
  breakdown: {
    committedBills: number;
    projectedDailySpend: number;
    goalCommitments: number;
    avgDailySpend: number;
    daysLeftInMonth: number;
  };
  upcomingBills: { name: string; amount: number; dueDate: string }[];
}

// ─── Intelligence — Decision Simulator ────────────────────────────────────
export interface SimulatePayload {
  amount: number;
  category: TransactionCategory;
  description?: string;
}

export interface GoalImpact {
  goalId: string;
  name: string;
  daysDelayed: number | null;
  message: string;
}

export interface SimulationResult {
  purchase: { amount: number; category: string; description?: string };
  safeToSpendBefore: number;
  safeToSpendAfter: number;
  budgetImpact: {
    category: string;
    currentSpent: number;
    limit: number;
    newSpent: number;
    remaining: number;
    percentageUsed: number;
    wouldExceed: boolean;
    wouldTriggerAlert: boolean;
  } | null;
  goalImpacts: GoalImpact[];
  cashflowRisk: {
    newBalance: number;
    daysOfRunway: number;
    isRisky: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    message: string;
  };
}

// ─── Intelligence — Projections ────────────────────────────────────────────
export interface ProjectionDay {
  date: string;
  projected: number;
  dailyBurn: number;
  events: { label: string; amount: number; type: 'expense' | 'income' }[];
  isLow: boolean;
}

export interface Projections {
  projection: ProjectionDay[];
  summary: {
    currentBalance: number;
    projectedBalance: number;
    lowestPoint: number;
    lowestDate: string | undefined;
    lowBalanceDays: number;
    firstLowBalanceDate: string | null;
    hasRecurringIncome: boolean;
    recurringIncomeDays: number[];
  };
}

// ─── Intelligence — Behavioral Insights ───────────────────────────────────
export interface WeekdayPattern {
  day: string;
  totalSpent: number;
  avgPerOccurrence: number;
  transactionCount: number;
}

export interface CategoryTrend {
  category: string;
  amount: number;
  percentage: number;
  prevAmount: number;
  changePercent: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface MerchantStat {
  merchant: string;
  totalSpent: number;
  visitCount: number;
  avgPerVisit: number;
}

export interface Habit {
  insight: string;
  severity: 'info' | 'warning' | 'positive';
}

export interface BehavioralInsights {
  weeklyPattern: WeekdayPattern[];
  weekendVsWeekday: {
    weekendAvgPerDay: number;
    weekdayAvgPerDay: number;
    ratio: number;
    insight: string;
  };
  spendingVelocity: {
    thisMonth: number;
    lastMonth: number;
    projectedThisMonth: number;
    ratio: number;
    trend: 'accelerating' | 'decelerating' | 'steady';
  };
  categoryTrends: CategoryTrend[];
  topMerchants: MerchantStat[];
  habits: Habit[];
}

// ─── Intelligence — Budget Suggestions ────────────────────────────────────
export interface BudgetSuggestion {
  category: string;
  suggestedLimit: number;
  currentLimit: number | null;
  analytics: {
    avgMonthly: number;
    maxMonthly: number;
    minMonthly: number;
    monthsAnalyzed: number;
  };
  trend: 'increasing' | 'decreasing' | 'stable';
  hasBudget: boolean;
  action: 'create' | 'update' | 'ok';
}

export interface BudgetSuggestions {
  suggestions: BudgetSuggestion[];
  totalAvgMonthlySpend: number;
  avgMonthlyIncome: number;
  savingsRate: number;
  recommendedBudgetingMode: 'zero-based' | 'envelope' | '50/30/20';
}

// ─── Intelligence — Cash Flow Intelligence ────────────────────────────────
export interface CashflowIntelligence {
  subscriptionSummary: {
    totalActive: number;
    estimatedMonthlyCost: number;
    estimatedYearlyCost: number;
  };
  cancellationCandidates: {
    company: string;
    amount: number;
    period: string;
    yearlyCost: number;
    reason: string;
  }[];
  upcomingBills: {
    company: string;
    amount: number;
    dueDate: string;
    daysUntilDue: number;
  }[];
  incomeSmoothing: {
    avgMonthlyIncome: number;
    isIrregular: boolean;
    variabilityPct: number;
    advice: string;
  };
}

// ─── App Billing (Vaultly subscription) ────────────────────────────────────
export type BillingPlan = 'monthly' | 'yearly';
export type SubscriptionStatus =
  | 'pending'
  | 'active'
  | 'past_due'
  | 'frozen'
  | 'cancelled';

export interface AppSubscription {
  id: string;
  user_id: string;
  plan: BillingPlan;
  status: SubscriptionStatus;
  billing_day: number;
  current_period_start: string;
  current_period_end: string;
  next_billing_date: string;
  grace_period_end: string | null;
  paypal_subscription_id: string | null;
  pending_paypal_subscription_id: string | null;
  pending_plan: BillingPlan | null;
  payment_method_last4: string | null;
  payment_method_brand: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AccessCheck {
  hasAccess: boolean;
  status: string;
  message?: string;
  gracePeriodEnd?: string;
  periodEnd?: string;
}

export interface PaymentRecord {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  plan: BillingPlan;
  paypal_subscription_id: string | null;
  paypal_capture_id: string | null;
  billing_date: string;
  description: string | null;
  created_at: string;
}

// ─── Summaries ─────────────────────────────────────────────────────────────

export interface SummaryCardBreakdown {
  cardId: string;
  lastFour: string;
  holder: string;
  type: string;
  amount: number;
  percentage: number;
}

export interface SummaryMerchant {
  merchant: string;
  total: number;
  transactionCount: number;
  avgPerVisit: number;
  percentage: number;
}

export interface SummaryBudgetPerformance {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  utilizationPct: number;
  status: 'ok' | 'warning' | 'exceeded';
}

export interface MonthlySummary {
  period: { month: number; year: number; label: string; start: string; end: string };
  overview: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
    expenseCount: number;
    incomeCount: number;
    subscriptionTotal: number;
    avgDailySpend: number;
  };
  vsLastMonth: {
    prevMonth: string;
    expenseChange: number | null;
    incomeChange: number | null;
    expenseDiff: number;
    incomeDiff: number;
  };
  byCategory: { category: string; amount: number; percentage: number }[];
  budgetPerformance: SummaryBudgetPerformance[];
  byCard: SummaryCardBreakdown[];
  topMerchants: SummaryMerchant[];
  dailyBreakdown: { date: string; expenses: number; income: number; net: number }[];
  topTransactions: {
    id: string; amount: number; description: string;
    merchant?: string; date: string; category: string; card_id?: string;
  }[];
  goalsSnapshot: {
    name: string; targetAmount: number; currentAmount: number;
    progressPct: number; status: string; deadline?: string;
  }[];
}

export interface YearlySummary {
  period: { year: number; label: string; start: string; end: string };
  overview: {
    totalIncome: number;
    totalExpenses: number;
    netSavings: number;
    savingsRate: number;
    transactionCount: number;
    avgMonthlyIncome: number;
    avgMonthlyExpenses: number;
    avgMonthlySavings: number;
    totalSubscriptionCost: number;
  };
  vsLastYear: {
    expenseChange: number | null;
    incomeChange: number | null;
    expenseDiff: number;
    incomeDiff: number;
  };
  highlights: {
    bestMonth: { label: string; netSavings: number } | null;
    worstMonth: { label: string; expenses: number } | null;
    highestSpendCategory: { category: string; amount: number; percentage: number } | null;
    topMerchant: SummaryMerchant | null;
  };
  monthlyBreakdown: {
    month: number; label: string; income: number; expenses: number;
    netSavings: number; savingsRate: number; transactionCount: number;
  }[];
  byCategory: { category: string; amount: number; percentage: number; avgPerMonth: number }[];
  budgetYearSummary: {
    category: string; totalLimit: number; totalSpent: number;
    avgMonthlyLimit: number; avgMonthlySpent: number;
    overallUtilization: number; monthsTracked: number;
  }[];
  byCard: SummaryCardBreakdown[];
  topMerchants: SummaryMerchant[];
  goalsSnapshot: {
    name: string; targetAmount: number; currentAmount: number;
    progressPct: number; status: string; deadline?: string;
  }[];
}

export interface SummaryPeriods {
  months: { month: number; year: number; label: string }[];
  years: number[];
}
