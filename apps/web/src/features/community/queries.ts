import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { CreatorPlatform, CreatorTag } from '@wowhelp/shared';
import { cacheLife, cacheTag } from 'next/cache';
import { isSupabaseConfigured, supabasePublishableKey, supabaseUrl } from '@/lib/supabase/env';
import { createAdminClient } from '@/lib/supabase/admin';

export interface ChannelView {
  id: string;
  platform: CreatorPlatform;
  handle: string;
  url: string;
  avatarUrl: string | null;
  isLive: boolean;
  liveTitle: string | null;
  liveGame: string | null;
  liveViewers: number | null;
  liveStartedAt: string | null;
  liveUrl: string | null;
  liveThumbnailUrl: string | null;
  latestTitle: string | null;
  latestUrl: string | null;
  latestThumbnailUrl: string | null;
  latestPublishedAt: string | null;
  checkedAt: string | null;
}

export interface CreatorView {
  id: string;
  slug: string;
  name: string;
  bioPt: string | null;
  bioEn: string | null;
  tags: CreatorTag[];
  status: 'draft' | 'published' | 'hidden';
  featured: boolean;
  featuredNotePt: string | null;
  featuredNoteEn: string | null;
  channels: ChannelView[];
}

const COLUMNS =
  'id, slug, display_name, bio_pt, bio_en, tags, status, featured, featured_note_pt, featured_note_en, creator_channels(id, platform, handle, url, avatar_url, is_live, live_title, live_game, live_viewers, live_started_at, live_url, live_thumbnail_url, latest_title, latest_url, latest_thumbnail_url, latest_published_at, checked_at)';

type Row = {
  id: string;
  slug: string;
  display_name: string;
  bio_pt: string | null;
  bio_en: string | null;
  tags: CreatorTag[];
  status: CreatorView['status'];
  featured: boolean;
  featured_note_pt: string | null;
  featured_note_en: string | null;
  creator_channels: {
    id: string;
    platform: CreatorPlatform;
    handle: string;
    url: string;
    avatar_url: string | null;
    is_live: boolean;
    live_title: string | null;
    live_game: string | null;
    live_viewers: number | null;
    live_started_at: string | null;
    live_url: string | null;
    live_thumbnail_url: string | null;
    latest_title: string | null;
    latest_url: string | null;
    latest_thumbnail_url: string | null;
    latest_published_at: string | null;
    checked_at: string | null;
  }[];
};

const ORDER: Record<CreatorPlatform, number> = { twitch: 0, youtube: 1, kick: 2 };

function toView(r: Row): CreatorView {
  return {
    id: r.id,
    slug: r.slug,
    name: r.display_name,
    bioPt: r.bio_pt,
    bioEn: r.bio_en,
    tags: r.tags,
    status: r.status,
    featured: r.featured,
    featuredNotePt: r.featured_note_pt,
    featuredNoteEn: r.featured_note_en,
    channels: [...r.creator_channels]
      .sort((a, b) => ORDER[a.platform] - ORDER[b.platform])
      .map((c) => ({
        id: c.id,
        platform: c.platform,
        handle: c.handle,
        url: c.url,
        avatarUrl: c.avatar_url,
        isLive: c.is_live,
        liveTitle: c.live_title,
        liveGame: c.live_game,
        liveViewers: c.live_viewers,
        liveStartedAt: c.live_started_at,
        liveUrl: c.live_url,
        liveThumbnailUrl: c.live_thumbnail_url,
        latestTitle: c.latest_title,
        latestUrl: c.latest_url,
        latestThumbnailUrl: c.latest_thumbnail_url,
        latestPublishedAt: c.latest_published_at,
        checkedAt: c.checked_at,
      })),
  };
}

/**
 * Criadores publicados (RLS) com os canais. Cache curto: o "ao vivo" muda a
 * cada poucos minutos; a curadoria e a tarefa agendada invalidam a tag.
 */
export async function getPublishedCreators(): Promise<CreatorView[] | null> {
  'use cache';
  cacheLife('minutes');
  cacheTag('community');
  if (!isSupabaseConfigured()) return null;
  const { data, error } = await createSupabaseClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
    .from('creators')
    .select(COLUMNS)
    .order('display_name')
    .limit(500)
    .returns<Row[]>();
  if (error || !data) return null;
  return data.map(toView);
}

/** Todos os criadores, inclusive rascunhos. Só chamar depois de requireAdmin(). */
export async function getAllCreators(): Promise<CreatorView[]> {
  const { data } = await createAdminClient()
    .from('creators')
    .select(COLUMNS)
    .order('display_name')
    .limit(1000)
    .returns<Row[]>();
  return (data ?? []).map(toView);
}

/** Um criador para edição. Só chamar depois de requireAdmin(). */
export async function getCreatorForEdit(id: string): Promise<CreatorView | null> {
  const { data } = await createAdminClient().from('creators').select(COLUMNS).eq('id', id).maybeSingle<Row>();
  return data ? toView(data) : null;
}

export interface RequestView {
  id: string;
  kind: 'join' | 'leave';
  displayName: string;
  links: string;
  message: string | null;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

/** Pedidos de entrar ou sair. Só chamar depois de requireAdmin(). */
export async function getCreatorRequests(status: RequestView['status'] = 'pending'): Promise<RequestView[]> {
  const { data } = await createAdminClient()
    .from('creator_requests')
    .select('id, kind, display_name, links, message, status, created_at')
    .eq('status', status)
    .order('created_at', { ascending: true })
    .limit(200);
  return (data ?? []).map((r) => ({
    id: r.id,
    kind: r.kind as RequestView['kind'],
    displayName: r.display_name,
    links: r.links,
    message: r.message,
    status: r.status as RequestView['status'],
    createdAt: r.created_at,
  }));
}
