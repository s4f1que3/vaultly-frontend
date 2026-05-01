import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import api from '@/lib/api';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscription = await request.json();

  try {
    await api.post('/notifications/subscribe', { subscription });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}
