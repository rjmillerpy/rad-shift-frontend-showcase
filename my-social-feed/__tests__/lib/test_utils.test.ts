import { isPlaceholderAvatar, proxyIfNeeded } from '@/lib/utils';

describe('proxyIfNeeded', () => {
  it('should proxy http URLs', () => {
    const url = 'http://example.com/image.png';
    const result = proxyIfNeeded(url);
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  });

  it('should proxy https URLs', () => {
    const url = 'https://example.com/image.png';
    const result = proxyIfNeeded(url);
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  });

  it('should not proxy relative URLs', () => {
    const url = '/images/local.png';
    const result = proxyIfNeeded(url);
    expect(result).toBe('/images/local.png');
  });

  it('should return undefined for undefined input', () => {
    const result = proxyIfNeeded(undefined);
    expect(result).toBeUndefined();
  });

  it('should return empty string as-is', () => {
    const result = proxyIfNeeded('');
    expect(result).toBe('');
  });

  it('should handle URLs with special characters', () => {
    const url = 'https://example.com/image with spaces.png';
    const result = proxyIfNeeded(url);
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(url)}`);
  });

  // Nitter instances proxy pbs.twimg.com under /pic/{url-encoded-path}. We
  // rewrite those to the canonical twimg URL so the proxy allow-list check
  // matches (nitter instances aren't allow-listed; twimg is).
  test.each([
    [
      'nitter.net photo',
      'https://nitter.net/pic/media%2FG6IFLKEbgAAT9Dl.jpg',
      'https://pbs.twimg.com/media/G6IFLKEbgAAT9Dl.jpg',
    ],
    [
      'nitter.net video thumbnail',
      'https://nitter.net/pic/amplify_video_thumb%2F123%2Fimg%2Fabc.jpg',
      'https://pbs.twimg.com/amplify_video_thumb/123/img/abc.jpg',
    ],
    [
      'nitter.poast.org photo',
      'https://nitter.poast.org/pic/media%2Fabc.jpg',
      'https://pbs.twimg.com/media/abc.jpg',
    ],
  ])('rewrites %s to twimg canonical URL before proxying', (_name, input, expected) => {
    const result = proxyIfNeeded(input);
    expect(result).toBe(`/api/image-proxy?url=${encodeURIComponent(expected)}`);
  });
});

describe('isPlaceholderAvatar', () => {
  test.each([
    ['ui-avatars root', 'https://ui-avatars.com/api/?name=User', true],
    ['ui-avatars with size', 'https://ui-avatars.com/api/?name=Us&size=128', true],
    ['real S3 image', 'https://radshift-bucket.s3.amazonaws.com/x.jpg', false],
    ['pinterest image', 'https://i.pinimg.com/x.jpg', false],
    ['empty string', '', false],
    ['null', null, false],
    ['undefined', undefined, false],
  ] as const)('%s → %s', (_name, input, expected) => {
    expect(isPlaceholderAvatar(input)).toBe(expected);
  });
});
