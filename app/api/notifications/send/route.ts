import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title, body, data } = await request.json();

  if (!title || !body) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 });
  }

  // Notification sending is handled by the NestJS backend via push service
  return NextResponse.json({ success: true, message: 'Notification queued' });
}
