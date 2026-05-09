import Link from 'next/link';

const sections = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    content: [
      {
        heading: 'Add your first card',
        body: 'Go to Cards and hit "Add Card". Enter your last 4 digits, card type (Visa/Mastercard/Amex), and starting balance. Vaultly uses this balance as your financial baseline — all transactions adjust it automatically.',
      },
      {
        heading: 'Set up your categories',
        body: 'Default categories (Food, Transport, Housing, etc.) are created automatically. You can create custom categories from the Budgets page — just type a name and pick an emoji.',
      },
      {
        heading: 'Log your first transaction',
        body: 'Hit "Add Transaction" from the dashboard or Transactions page. Pick income, expense, or transfer. Vaultly will auto-suggest a category based on the merchant name — you can always override it and it learns your correction for next time.',
      },
    ],
  },
  {
    id: 'transactions',
    icon: '💳',
    title: 'Transactions',
    content: [
      {
        heading: 'Auto-categorization',
        body: 'When you enter a merchant name (e.g. "Netflix", "McDonald\'s"), Vaultly automatically assigns a category. If it gets it wrong, change it — Vaultly remembers your correction and applies it to that merchant in the future.',
      },
      {
        heading: 'Split transactions',
        body: 'Hit "Split by category" inside the transaction form to divide one transaction across multiple categories. Useful for mixed purchases (e.g. a supermarket run with groceries and household items). The split amounts must add up to the total.',
      },
      {
        heading: 'CSV import',
        body: 'Export a statement from your bank (most banks offer this under "Download transactions") and drag it into the import modal on the Transactions page. Vaultly auto-detects date, amount, and description columns and suggests categories. You can edit each row before confirming.',
      },
      {
        heading: 'Filters & search',
        body: 'Use the search bar and dropdowns to filter by type, category, or keyword. Filters apply instantly across your full transaction history.',
      },
    ],
  },
  {
    id: 'budgets',
    icon: '🪣',
    title: 'Budgets',
    content: [
      {
        heading: 'Creating budgets',
        body: 'Set a monthly spending limit per category. Vaultly tracks your actual spend against each limit in real time as you log transactions.',
      },
      {
        heading: 'Alert threshold',
        body: 'Each budget has an alert threshold (default 80%). When your spending hits that percentage, you get a notification. You can change the threshold per budget.',
      },
      {
        heading: 'Rollover',
        body: 'Toggle rollover on any budget and unspent funds carry forward to the next month. A green "+$X" tag shows your rollover bonus on the budget card.',
      },
      {
        heading: 'Predictive alerts',
        body: 'Vaultly projects your spending pace mid-month and warns you before you overspend — not after. These appear on the dashboard and in notifications.',
      },
      {
        heading: 'Budget suggestions',
        body: 'Hit "Suggestions" on the Budgets page. Vaultly analyses your last 3 months and recommends limits per category, including whether to create, update, or leave each budget alone.',
      },
    ],
  },
  {
    id: 'recurring',
    icon: '🔄',
    title: 'Recurring Transactions',
    content: [
      {
        heading: 'What are recurring transactions?',
        body: 'Any fixed income or expense that repeats on a schedule — rent, salary, subscriptions, loan repayments. Set it once and Vaultly auto-logs it each period so your history stays accurate without manual entry.',
      },
      {
        heading: 'Frequencies',
        body: 'Choose from daily, weekly, every 2 weeks, monthly, or yearly. For monthly, you can specify the exact day of month (e.g. rent on the 1st, salary on the 25th).',
      },
      {
        heading: 'Pausing vs deleting',
        body: 'Toggle the switch on any recurring item to pause it — it stops auto-logging but keeps the record. Delete it if you\'ve cancelled the subscription or expense entirely.',
      },
      {
        heading: 'End date',
        body: 'Set an end date for finite commitments (e.g. a 12-month loan). Vaultly automatically deactivates it when the end date passes.',
      },
    ],
  },
  {
    id: 'goals',
    icon: '🎯',
    title: 'Savings Goals',
    content: [
      {
        heading: 'Creating a goal',
        body: 'Set a target amount, deadline, and icon. Add an initial balance if you\'ve already saved something toward it.',
      },
      {
        heading: 'Feasibility score',
        body: 'Each goal shows a Realistic, Tight, or Unreachable badge based on your current savings rate and how much needs to be saved per month to hit the deadline. Tap the badge to see the breakdown.',
      },
      {
        heading: 'Contributing',
        body: 'Hit "Add savings" on any goal to manually contribute. When the goal is fully funded, it\'s marked complete and you\'re notified.',
      },
      {
        heading: 'No deadline goals',
        body: 'Leave the deadline blank and Vaultly will tell you how many months it will take to reach the target at your current savings rate.',
      },
    ],
  },
  {
    id: 'savings',
    icon: '🏦',
    title: 'Savings Pots & Rules',
    content: [
      {
        heading: 'Savings pots',
        body: 'Think of pots as virtual envelopes — separate buckets for different purposes (e.g. Emergency Fund, Holiday, New Laptop). They don\'t have a target or deadline, just a growing balance.',
      },
      {
        heading: 'Auto-transfer rules',
        body: 'Create rules that automatically move money into a pot. Choose monthly (runs on the 1st), on income (fires when income is detected), or percentage of income. Rules run in the background.',
      },
    ],
  },
  {
    id: 'net-worth',
    icon: '📊',
    title: 'Net Worth',
    content: [
      {
        heading: 'How it\'s calculated',
        body: 'Assets = card balances + savings pots + goal savings. Liabilities = anything you add manually (mortgages, loans, credit card debt). Net Worth = Assets − Liabilities.',
      },
      {
        heading: 'Adding liabilities',
        body: 'Hit "Add Liability" and enter the balance, interest rate, and minimum payment. Keep balances updated as you pay down debt for an accurate net worth figure.',
      },
    ],
  },
  {
    id: 'debt-planner',
    icon: '📉',
    title: 'Debt Payoff Planner',
    content: [
      {
        heading: 'Avalanche vs Snowball',
        body: 'Avalanche pays off your highest-interest debt first — minimises total interest paid. Snowball pays smallest balance first — gives quicker psychological wins. Vaultly shows you both payoff dates and total interest so you can choose.',
      },
      {
        heading: 'Monthly budget',
        body: 'Enter how much you can put toward debt repayment each month (must be at least the sum of all minimum payments). Vaultly shows your debt-free date and a month-by-month payoff chart.',
      },
      {
        heading: 'Debts come from Net Worth',
        body: 'The planner uses the liabilities you\'ve entered on the Net Worth page. Keep those balances current for accurate projections.',
      },
    ],
  },
  {
    id: 'cashflow',
    icon: '🌊',
    title: 'Cash Flow Forecast',
    content: [
      {
        heading: 'What it shows',
        body: 'A day-by-day balance projection for the next 30, 60, or 90 days — accounting for your average daily spend, upcoming subscriptions/recurring transactions, and detected income patterns.',
      },
      {
        heading: 'Low balance warnings',
        body: 'Days where your balance is projected to drop below $200 are flagged in red. The first warning date and total low-balance days are shown in the summary cards.',
      },
      {
        heading: 'Events',
        body: 'Scroll the events list to see which specific bills or income deposits are driving balance changes on any given day.',
      },
    ],
  },
  {
    id: 'analytics',
    icon: '📈',
    title: 'Analytics',
    content: [
      {
        heading: 'Spending forecast',
        body: 'Uses a weighted moving average across your last 6 months (recent months count more) to predict next month\'s spend per category. The pace indicator shows whether you\'re spending faster or slower than your forecast this month.',
      },
      {
        heading: 'Category trends',
        body: 'Month-over-month sparklines per category with a trend arrow. Red = increasing, green = decreasing.',
      },
      {
        heading: 'Anomaly detection',
        body: 'Vaultly flags price spikes (a merchant charged significantly more than usual), new recurring charges (a merchant appearing multiple times for the first time), and unusually large transactions.',
      },
      {
        heading: 'Seasonality',
        body: 'If you have 12+ months of history, Vaultly detects seasonal spending patterns per category — months where you typically spend more (e.g. shopping in December) and warns you about upcoming spikes.',
      },
    ],
  },
  {
    id: 'health-score',
    icon: '💚',
    title: 'Financial Health Score',
    content: [
      {
        heading: 'What is it?',
        body: 'A 0–100 score (with a letter grade A–F) that summarises your financial wellbeing across five areas. It updates automatically as your data changes.',
      },
      {
        heading: 'The five components',
        body: 'Savings Rate (25 pts) — what % of income you\'re saving. Budget Adherence (20 pts) — how many budgets you\'ve stayed within. Emergency Fund (20 pts) — months of expenses covered by your balance. Goal Progress (20 pts) — average % completion across active goals. Debt Load (15 pts) — your debt-to-annual-income ratio.',
      },
    ],
  },
  {
    id: 'household',
    icon: '👨‍👩‍👧',
    title: 'Household (Shared Budgets)',
    content: [
      {
        heading: 'Creating a household',
        body: 'Go to the Household page and create one. You\'re the owner. There can only be one household per account.',
      },
      {
        heading: 'Inviting members',
        body: 'Enter their email address. They\'ll receive an invite email with a link to accept. Once they log in and accept, they\'re part of the household.',
      },
      {
        heading: 'Leaving or deleting',
        body: 'Members can leave at any time. Only the owner can delete the household. Deleting removes all members.',
      },
    ],
  },
  {
    id: 'notifications',
    icon: '🔔',
    title: 'Notifications',
    content: [
      {
        heading: 'Types of notifications',
        body: 'Budget alerts (when you hit your threshold), predictive alerts (projected overspend before it happens), goal achieved, weekly digest summary, and system messages.',
      },
      {
        heading: 'Weekly digest',
        body: 'Every Monday morning Vaultly sends a summary of last week\'s spending vs the week before. Toggle this on/off in Settings.',
      },
      {
        heading: 'Push notifications',
        body: 'Enable push notifications in Settings to receive alerts even when the app isn\'t open (browser must support web push).',
      },
    ],
  },
  {
    id: 'settings',
    icon: '⚙️',
    title: 'Settings & Preferences',
    content: [
      {
        heading: 'Currency',
        body: 'Change your display currency from Settings. All amounts are formatted in your chosen currency (note: Vaultly stores raw numbers — it doesn\'t do live FX conversion).',
      },
      {
        heading: 'Theme',
        body: 'Switch between dark and light mode.',
      },
      {
        heading: 'Notification preferences',
        body: 'Toggle budget alerts, goal reminders, and weekly summary independently.',
      },
    ],
  },
];

export default function ManualPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
        <div className="max-w-4xl mx-auto px-6 py-8 flex items-center justify-between">
          <div>
            <Link href="/dashboard" className="text-sm text-[var(--color-accent)] hover:underline mb-2 inline-block">← Back to Vaultly</Link>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mt-1">User Manual</h1>
            <p className="text-[var(--color-text-secondary)] mt-2">Everything you need to know about using Vaultly.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 flex gap-10">
        {/* Sidebar TOC — hidden on mobile */}
        <aside className="hidden lg:block w-52 shrink-0">
          <div className="sticky top-8 space-y-1">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-3">Contents</p>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`}
                className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] py-1 transition-colors">
                <span>{s.icon}</span>
                <span>{s.title}</span>
              </a>
            ))}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 space-y-14">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-8">
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl">{section.icon}</span>
                <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">{section.title}</h2>
              </div>
              <div className="space-y-6">
                {section.content.map((item) => (
                  <div key={item.heading} className="border-l-2 border-[var(--color-accent)] pl-5">
                    <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-2">{item.heading}</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{item.body}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}

          {/* Bottom CTA */}
          <div className="border border-[var(--color-border)] rounded-2xl p-8 text-center bg-[var(--color-bg-secondary)]">
            <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Still have questions?</p>
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">Reach out and we'll get back to you.</p>
            <a href="mailto:contact@vaultly.cash"
              className="inline-block bg-[var(--color-accent)] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
              contact@vaultly.cash
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
