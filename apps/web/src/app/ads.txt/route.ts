import { ADSENSE_CLIENT } from '@/features/ads/config';

// ads.txt: diz aos compradores de anúncio quem pode vender espaço no site.
// Só existe quando o AdSense está configurado.
export function GET() {
  if (!ADSENSE_CLIENT) return new Response('Not found', { status: 404 });
  const publisher = ADSENSE_CLIENT.replace(/^ca-/, '');
  return new Response(`google.com, ${publisher}, DIRECT, f08c47fec0942fa0\n`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });
}
