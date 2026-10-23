'use client';

import { useLocale } from 'next-intl';
import { useSyncExternalStore } from 'react';

const noop = () => () => {};

/**
 * Data no fuso do próprio aparelho do jogador. No servidor (e no primeiro
 * render) mostra em UTC com o rótulo, para não haver diferença de hidratação.
 */
export function LocalTime({ iso }: { iso: string }) {
  const locale = useLocale();
  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
  const date = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', hour: '2-digit', minute: '2-digit' };
  const text = isClient
    ? new Intl.DateTimeFormat(locale, opts).format(date)
    : `${new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(date)} UTC`;
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {text}
    </time>
  );
}
