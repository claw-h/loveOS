// app/api/profile/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const body   = await req.json();

  const updates: Record<string, any> = { updated_at: new Date().toISOString() };

  // ── Fields the user can change ──
  if (body.display_name !== undefined) {
    updates.display_name = String(body.display_name).trim().slice(0, 32);
  }
  if (body.avatar_emoji !== undefined) {
    updates.avatar_emoji = String(body.avatar_emoji).trim().slice(0, 8);
  }
  if (body.accent_color !== undefined) {
    // Validate hex color
    if (/^#[0-9a-fA-F]{6}$/.test(body.accent_color)) {
      updates.accent_color = body.accent_color;
    }
  }
  if (body.username !== undefined) {
    const newUsername = String(body.username).toLowerCase().trim();
    if (newUsername.length < 2 || newUsername.length > 24) {
      return NextResponse.json({ error: 'Username must be 2–24 characters' }, { status: 400 });
    }
    // Check uniqueness
    const { data: existing } = await supabaseAdmin
      .from('portal_users')
      .select('id')
      .eq('username', newUsername)
      .neq('id', userId)
      .single();
    if (existing) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }
    updates.username = newUsername;
  }
  if (body.new_password !== undefined) {
    if (!body.current_password) {
      return NextResponse.json({ error: 'Current password required' }, { status: 400 });
    }
    // Verify current password
    const { data: user } = await supabaseAdmin
      .from('portal_users')
      .select('password_hash')
      .eq('id', userId)
      .single();
    const valid = user && await bcrypt.compare(body.current_password, user.password_hash);
    if (!valid) {
      return NextResponse.json({ error: 'Current password incorrect' }, { status: 403 });
    }
    if (String(body.new_password).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }
    updates.password_hash = await bcrypt.hash(body.new_password, 10);
  }

  const { error } = await supabaseAdmin
    .from('portal_users')
    .update(updates)
    .eq('id', userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updates: Object.keys(updates) });
}