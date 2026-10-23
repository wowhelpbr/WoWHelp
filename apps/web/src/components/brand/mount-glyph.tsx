import type { SVGProps } from 'react';

/** Cabeça de montaria (o lucide não tem cavalo). Mesmo traço dos ícones lucide. */
export function MountGlyph(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 21v-4.5c0-1.3-.6-2.4-1.6-3.2L4 12l2.2-3.8L9 6.5 10.5 3l1.6 3.1c3.6.8 6.4 3.7 7.3 7.4L20 17" />
      <path d="M12 21v-3.5l3-2" />
      <path d="M9.2 9.4h.01" />
    </svg>
  );
}
