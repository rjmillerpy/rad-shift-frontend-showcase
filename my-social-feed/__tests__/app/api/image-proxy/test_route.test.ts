/**
 * @jest-environment node
 */

/**
 * Tests for /api/image-proxy route handler
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from '@/app/api/image-proxy/route';
import { NextRequest } from 'next/server';

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/image-proxy');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

describe('/api/image-proxy', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 400 when url param is missing', async () => {
    const req = makeRequest({});
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Missing url');
  });

  it('proxies an allowed host URL successfully', async () => {
    const imageBytes = new Uint8Array([137, 80, 78, 71]); // PNG header
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageBytes.buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    const req = makeRequest({ url: 'https://radshift-bucket.s3.amazonaws.com/photo.png' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=3600');
  });

  it('returns 502 when upstream fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers(),
    });

    const req = makeRequest({ url: 'https://radshift-bucket.s3.amazonaws.com/missing.png' });
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toBe('Upstream failed');
  });

  it('uses application/octet-stream as default content-type', async () => {
    const imageBytes = new Uint8Array([0, 1, 2, 3]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageBytes.buffer),
      headers: new Headers({}),
    });

    const req = makeRequest({ url: 'https://radshift-bucket.s3.amazonaws.com/unknown' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/octet-stream');
  });

  // SSRF protection tests
  it('rejects disallowed host', async () => {
    const req = makeRequest({ url: 'https://evil.com/steal-data' });
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Host not allowed');
  });

  it('rejects non-http protocol', async () => {
    const req = makeRequest({ url: 'file:///etc/passwd' });
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid URL', async () => {
    const req = makeRequest({ url: 'not-a-url' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid url');
  });

  it('allows ui-avatars.com', async () => {
    const imageBytes = new Uint8Array([0]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageBytes.buffer),
      headers: new Headers({ 'content-type': 'image/png' }),
    });

    const req = makeRequest({ url: 'https://ui-avatars.com/api/?name=User' });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  // Bot-content CDNs — added so posts created by the pinterest/reddit/x
  // generators actually render. Each entry corresponds to a real generator
  // platform in app/generators/platforms.
  test.each([
    ['pinterest', 'https://i.pinimg.com/originals/aa/bb/cc.jpg'],
    ['pinterest-secondary', 'https://s.pinimg.com/webapp/cat.jpg'],
    ['reddit', 'https://i.redd.it/abcd1234.png'],
    ['reddit-preview', 'https://preview.redd.it/xyz.jpg'],
    ['reddit-external-preview', 'https://external-preview.redd.it/xyz.jpe'],
    ['twitter', 'https://pbs.twimg.com/media/photo.jpg'],
  ])('allows %s CDN URL: %s', async (_name, url) => {
    const imageBytes = new Uint8Array([137, 80, 78, 71]);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(imageBytes.buffer),
      headers: new Headers({ 'content-type': 'image/jpeg' }),
    });
    const req = makeRequest({ url });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });

  it('rejects internal network addresses', async () => {
    const req = makeRequest({ url: 'http://169.254.169.254/latest/meta-data/' });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });

  it('rejects localhost URLs', async () => {
    const req = makeRequest({ url: 'http://localhost:5000/auth/login' });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});
