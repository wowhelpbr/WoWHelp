'use server';

import { cookies } from 'next/headers';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  GATE_COOKIE,
  GATE_MAX_AGE,
  PBKDF2_ITERATIONS,
  clearGateCache,
  gateToken,
  hashPassword,
  newSalt,
} from '@/lib/site-gate';
import { getAdminUser } from './session';

export type SiteSettingsState =
  | { status: 'idle' }
  | { status: 'saved'; private: boolean; at: number }
  | { status: 'error'; code: 'forbidden' | 'needs_password' | 'too_short' | 'mismatch' | 'storage' };

/** Liga/desliga o site privado e troca a senha. Só administrador. */
export async function saveSiteSettingsAction(_prev: SiteSettingsState, formData: FormData): Promise<SiteSettingsState> {
  const admin = await getAdminUser();
  if (!admin) return { status: 'error', code: 'forbidden' };

  const makePrivate = formData.get('private') === 'on';
  const password = z
    .string()
    .max(200)
    .catch('')
    .parse(formData.get('password') ?? '');
  const confirm = z
    .string()
    .max(200)
    .catch('')
    .parse(formData.get('confirm') ?? '');

  const db = createAdminClient();
  const { data: current, error: readError } = await db
    .from('site_settings')
    .select('password_hash')
    .eq('id', true)
    .single();
  if (readError) return { status: 'error', code: 'storage' };

  const update: Record<string, unknown> = { private: makePrivate, updated_by: admin.id };
  if (password) {
    if (password.length < 8) return { status: 'error', code: 'too_short' };
    if (password !== confirm) return { status: 'error', code: 'mismatch' };
    const salt = newSalt();
    update.password_salt = salt;
    update.password_iterations = PBKDF2_ITERATIONS;
    update.password_hash = await hashPassword(password, salt, PBKDF2_ITERATIONS);
  } else if (makePrivate && !current?.password_hash) {
    return { status: 'error', code: 'needs_password' };
  }

  const { data: saved, error } = await db
    .from('site_settings')
    .update(update)
    .eq('id', true)
    .select('password_hash')
    .single();
  if (error || !saved) return { status: 'error', code: 'storage' };
  clearGateCache();

  // Quem salvou não fica trancado do lado de fora.
  if (makePrivate && saved.password_hash) {
    (await cookies()).set(GATE_COOKIE, await gateToken(saved.password_hash as string), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: GATE_MAX_AGE,
    });
  }
  return { status: 'saved', private: makePrivate, at: Date.now() };
}
