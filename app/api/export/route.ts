import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format') || 'csv';

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .order('date', { ascending: false });

  if (format === 'csv') {
    const headers = ['Date', 'Description', 'Merchant', 'Category', 'Type', 'Amount'];
    const rows = (transactions || []).map((t) => [
      t.date, t.description, t.merchant || '', t.category, t.type, t.amount,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="vaultly-transactions.csv"',
      },
    });
  }

  return NextResponse.json({ data: transactions });
}
