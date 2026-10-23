'use client';

import { createBrowserClient } from '@supabase/ssr';
import { supabasePublishableKey, supabaseUrl } from './env';

/** Cliente do navegador (singleton gerenciado pelo @supabase/ssr). */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
