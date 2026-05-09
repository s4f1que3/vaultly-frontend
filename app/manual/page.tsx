import Link from 'next/link';

const sections = [
  {
    id: 'getting-started',
    icon: '🚀',
    title: 'Getting Started',
    content: [
      {
        heading: 'Add your first card',
        body: 'Go to Cards and hit "Add Card". Enter your last 4 digits, card type, starting balance, and optionally link the card to a savings pot (if your card and pot represent the same money — this prevents double-counting in Net Worth). Vaultly uses the card balance as your financial baseline and adjusts it automatically as you log transactions.',
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
    id: 'cards',
    icon: '💳',
    title: 'Cards',
    content: [
      {
        heading: 'Managing cards',
        body: 'Each card tracks its balance dynamically — the starting balance you enter plus all income and expense transactions linked to it. The Cards page always shows the live adjusted balance, not just the stored one.',
      },
      {
        heading: 'Editing a card',
        body: 'Open a card and hit the edit (pencil) icon. You can update the card holder name, expiry, theme, current balance, and credit limit. Updating the balance sets a new baseline — subsequent transactions adjust from there.',
      },
      {
        heading: 'Linking to a savings pot',
        body: 'If a savings pot and a card represent the same real bank account (e.g. your current account pot and its debit card), link them in the Edit Card modal. When linked, Net Worth counts only the pot balance — the card balance is excluded to prevent double-counting. A link indicator appears below the card on the Cards page.',
      },
      {
        heading: 'Card detail page',
        body: 'Click any card to see a full transaction history for that card, total spent, total income, and a link indicator if the card is tied to a savings pot.',
      },
    ],
  },
  {
    id: 'transactions',
    icon: '↕️',
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
        body: 'Export a statement from your bank (most banks offer this under "Download transactions") and drag the CSV into the import modal on the Transactions page. Vaultly handles Windows line endings, quoted fields with commas, and flexible column names — it auto-detects date, amount, and description and suggests a category per row. Edit any row before confirming.',
      },
      {
        heading: 'Household transactions',
        body: 'If you are in a household, transactions from all members appear in your feed. Each non-own transaction shows a small name badge (e.g. "Sarah") so you always know who made it.',
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
        heading: 'Household budgets',
        body: 'When you are in a household, each budget\'s spent amount reflects the combined spending of all household members for that category — not just your own. A small "household" badge appears on the budget card when this is active.',
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
        heading: 'Recurring vs subscription',
        body: 'The New Recurring modal has two modes. "Recurring" is for any repeating income or expense (rent, salary, loan repayments) with full frequency control. "Subscription" is for services billed monthly or yearly (Netflix, iCloud, Adobe) — Vaultly auto-bills these on their exact due date and advances the billing date each cycle.',
      },
      {
        heading: 'Monthly totals summary',
        body: 'The top of the Recurring page shows three stat cards: Subscriptions/mo (monthly cost of all active subscriptions, yearly ones divided by 12), Recurring/mo (monthly equivalent of active recurring expenses), and Total/mo (combined). This gives you an instant picture of your fixed monthly commitments.',
      },
      {
        heading: 'Frequencies',
        body: 'Choose from daily, weekly, every 2 weeks, monthly, or yearly. For monthly you can specify the exact day of month (e.g. rent on the 1st, salary on the 25th). Subscriptions use monthly or yearly only.',
      },
      {
        heading: 'Link transactions',
        body: 'Toggle "Link transactions" in the recurring form to create a second automatic transaction on the same date — in a different budget category. For example: primary transaction = Transfer type on your Transfer budget (outflow), linked transaction = Income on your General budget (inflow). The linked transaction can have its own type (expense/income/transfer) and, if transfer, a budget impact (increase/decrease/none).',
      },
      {
        heading: 'Pausing vs deleting',
        body: 'Toggle the switch on any recurring item to pause it — it stops auto-logging but keeps the record. Delete it if you\'ve cancelled the commitment entirely. Subscriptions and recurring transactions can both be paused from this page.',
      },
      {
        heading: 'End date',
        body: 'Set an end date for finite commitments (e.g. a 12-month loan). Vaultly automatically deactivates the recurring when the end date passes.',
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
        body: 'Each goal shows a Realistic, Tight, or Unreachable badge based on your current savings rate and how much needs to be saved per month to hit the deadline.',
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
        body: 'Think of pots as virtual envelopes — separate buckets for different purposes (e.g. Emergency Fund, Holiday, New Laptop). They don\'t have a target or deadline, just a growing balance. Pots count toward your Net Worth as assets.',
      },
      {
        heading: 'Linking a pot to a card',
        body: 'If a pot represents the same money as a debit card (e.g. your current account), link them in the Edit Card modal. When linked, Net Worth only counts the pot — the card balance is excluded, preventing double-counting.',
      },
      {
        heading: 'Auto-transfer rules',
        body: 'Create rules that automatically move money into a pot. Choose monthly (runs on the 1st), on income (fires when income is detected), or percentage of income. Rules run in the background without any manual steps.',
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
        body: 'Assets = card balances (transaction-adjusted) + savings pots + goal savings. Cards that are linked to a savings pot are excluded from the card balance total to prevent double-counting. Liabilities = debts you add manually. Net Worth = Assets − Liabilities.',
      },
      {
        heading: 'Avoiding double-counting',
        body: 'If your savings pot and debit card represent the same bank account, link the card to the pot via Edit Card. Net Worth will then count only the pot, not the card, keeping your figure accurate.',
      },
      {
        heading: 'Adding liabilities',
        body: 'Hit "Add Liability" and choose a type (Mortgage, Auto Loan, Student Loan, Credit Card, Personal Loan, Other). Enter the balance, interest rate, and minimum monthly payment. The type selector uses icon cards for quick selection.',
      },
      {
        heading: 'Keeping it current',
        body: 'Card balances update automatically as you log transactions. Savings pot and liability balances are manually maintained — update them whenever you make a significant payment or deposit.',
      },
    ],
  },
  {
    id: 'debt-planner',
    icon: '📉',
    title: 'Debt Planner',
    content: [
      {
        heading: 'Two tabs: Loan Calculator and Payoff Planner',
        body: 'The Debt Planner has two modes. Loan Calculator is a standalone tool for calculating any loan — no existing debts required. Payoff Planner uses the liabilities from your Net Worth page to build a payoff schedule for your real debts.',
      },
      {
        heading: 'Loan Calculator — monthly payment',
        body: 'Enter a loan amount, interest rate, optional down payment, and pick a term (5/10/15/20/25/30 years). The calculator instantly shows your monthly payment, total interest paid, total cost, and a principal-vs-interest bar. Everything updates live as you type.',
      },
      {
        heading: 'Purchasing power',
        body: 'Enter a monthly budget you can afford and the calculator tells you the maximum loan you can take on at the current rate and term. Add a down payment and it shows the total purchase price (loan + down payment). Useful for house or car shopping — know your ceiling before you browse.',
      },
      {
        heading: 'Pay it off early',
        body: 'Enter an extra monthly payment amount and see exactly how much interest you save and how many months earlier you\'d be debt-free. The amortization chart updates to reflect the shorter timeline.',
      },
      {
        heading: 'Term comparison table',
        body: 'All six standard terms (5–30 years) are shown side by side with monthly payment, total interest, and total cost. The currently selected term is highlighted so you can see the trade-offs at a glance.',
      },
      {
        heading: 'Payoff Planner — Avalanche vs Snowball',
        body: 'Avalanche pays your highest-interest debt first (minimises total interest). Snowball pays smallest balance first (quicker wins). Set your monthly repayment budget, choose a strategy, and Vaultly shows your debt-free date, total interest paid, and a balance-over-time chart.',
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
        body: 'A day-by-day balance projection for the next 30, 60, or 90 days — starting from your actual current balance (card balances adjusted for all transactions), then applying your average daily spend, upcoming subscriptions, and detected recurring income patterns.',
      },
      {
        heading: 'How the current balance is calculated',
        body: 'Cash Flow reads your card\'s stored balance and adds all transaction deltas on top. This means the starting point reflects your real money, not just what you typed when you created the card.',
      },
      {
        heading: 'Low balance warnings',
        body: 'Days where your balance is projected to drop below $200 are flagged. The summary shows how many low-balance days there are and the first date it occurs. The warning is driven by your spending pattern — adding income raises your starting balance but if your daily burn is high the projection will still show a decline.',
      },
      {
        heading: 'Events list',
        body: 'Scroll the Upcoming Events list to see which specific bills or income deposits affect your balance on any given day. Expected income appears when Vaultly detects you\'ve received income on the same day of the month at least twice in the past 90 days.',
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
        body: 'Uses a weighted moving average across your last 6 months (recent months count more) to predict next month\'s spend per category. The pace indicator on each budget shows whether you\'re spending faster or slower than forecast this month.',
      },
      {
        heading: 'Category trends',
        body: 'Month-over-month sparklines per category with a trend arrow. Red = increasing spend, green = decreasing.',
      },
      {
        heading: 'Anomaly detection',
        body: 'Vaultly flags price spikes (a merchant charged significantly more than usual), new recurring charges (a merchant appearing multiple times for the first time), and unusually large one-off transactions.',
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
        body: 'A 0–100 score (with a letter grade A–F) that summarises your financial wellbeing across five areas. It updates automatically as your data changes and appears on the dashboard.',
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
    title: 'Household',
    content: [
      {
        heading: 'Creating a household',
        body: 'Go to the Household page and create one with a name. You become the owner. There can only be one household per account.',
      },
      {
        heading: 'Inviting members',
        body: 'Enter a member\'s email address. They receive an invite email. Once they log in and accept, they join the household and data sharing activates immediately.',
      },
      {
        heading: 'What gets shared',
        body: 'Everyone operates independently — their own cards, budgets, goals, and settings. What changes: Transactions from all members appear in your feed (tagged with the member\'s name). Budget spending totals aggregate across all members — so if your Food budget is $600 and two people spend $200 each, it shows $400 spent total with a "household" badge.',
      },
      {
        heading: 'What stays private',
        body: 'Cards, savings pots, goals, and settings remain individual. Net Worth is calculated per person. Each person only sees transactions in their own feed (plus household members\').',
      },
      {
        heading: 'Member display',
        body: 'The Household page shows each member\'s real name and email address (not a truncated ID). The owner is marked with a crown icon.',
      },
      {
        heading: 'Leaving or deleting',
        body: 'Members can leave at any time. Only the owner can delete the household — this removes all members instantly.',
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
