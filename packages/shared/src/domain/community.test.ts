import { describe, expect, it } from 'vitest';
import { parseChannel, parseKick, parseTwitch, parseYouTube, slugify } from './community';

describe('canais da Comunidade BR', () => {
  it('Twitch: link ou nome viram o link oficial em minúsculas', () => {
    for (const input of [
      'https://www.twitch.tv/Streamer_BR',
      'twitch.tv/streamer_br',
      'Streamer_BR',
      'https://m.twitch.tv/streamer_br/videos',
    ]) {
      expect(parseTwitch(input)).toEqual({
        platform: 'twitch',
        handle: 'streamer_br',
        url: 'https://www.twitch.tv/streamer_br',
        externalId: null,
      });
    }
  });

  it('YouTube: @handle, link do handle ou id do canal', () => {
    expect(parseYouTube('https://www.youtube.com/@CanalWoW')).toMatchObject({
      handle: '@CanalWoW',
      url: 'https://www.youtube.com/@CanalWoW',
    });
    expect(parseYouTube('@CanalWoW')?.url).toBe('https://www.youtube.com/@CanalWoW');
    expect(parseYouTube('https://youtube.com/channel/UCabcdefghijklmnopqrstuv')).toEqual({
      platform: 'youtube',
      handle: 'UCabcdefghijklmnopqrstuv',
      url: 'https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv',
      externalId: 'UCabcdefghijklmnopqrstuv',
    });
  });

  it('Kick: link ou nome', () => {
    expect(parseKick('https://kick.com/CanalKick')?.url).toBe('https://kick.com/canalkick');
    expect(parseChannel('kick', 'canal-kick')?.handle).toBe('canal-kick');
  });

  it('recusa outro site, credenciais, javascript e nomes inválidos', () => {
    expect(parseTwitch('https://evil.com/streamer')).toBeNull();
    expect(parseTwitch('https://user:pw@twitch.tv/streamer')).toBeNull();
    expect(parseTwitch('javascript:alert(1)')).toBeNull();
    expect(parseTwitch('a b')).toBeNull();
    expect(parseYouTube('https://www.youtube.com/watch?v=abc')).toBeNull();
    expect(parseYouTube('https://youtube.com.evil.com/@x')).toBeNull();
    expect(parseKick('')).toBeNull();
  });

  it('slug sem acento', () => {
    expect(slugify('  Ação Épica BR!! ')).toBe('acao-epica-br');
    expect(slugify('Ninja_Zé 2')).toBe('ninja-ze-2');
  });
});
