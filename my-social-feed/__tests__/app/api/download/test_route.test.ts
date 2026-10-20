/**
 * @jest-environment node
 */

/**
 * Tests for /api/download route handler
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from '@/app/api/download/route';
import { NextRequest } from 'next/server';

function makeRequest(params: Record<string, string>) {
  const url = new URL('http://localhost:3000/api/download');
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString());
}

describe('/api/download', () => {
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

  it('returns 403 for disallowed hosts', async () => {
    const req = makeRequest({ url: 'https://evil.com/malware.exe' });
    const res = await GET(req);
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Host not allowed');
  });

  it('returns 400 for invalid protocol (ftp)', async () => {
    const req = makeRequest({ url: 'ftp://radshift-bucket.s3.amazonaws.com/file.txt' });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('Invalid protocol');
  });

  it('succeeds for allowed host (radshift-bucket.s3.amazonaws.com)', async () => {
    const mockBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('file content'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      status: 200,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': '12',
      }),
    });

    const req = makeRequest({
      url: 'https://radshift-bucket.s3.amazonaws.com/image.png',
      filename: 'my-image.png',
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/png');
    expect(res.headers.get('Content-Disposition')).toContain('my-image.png');
  });

  it('sanitizes filename to remove special characters', async () => {
    const mockBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      status: 200,
      headers: new Headers({
        'content-type': 'application/octet-stream',
      }),
    });

    const req = makeRequest({
      url: 'https://s3.amazonaws.com/file.bin',
      filename: 'my file (1)!@#.bin',
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const disposition = res.headers.get('Content-Disposition')!;
    // Extract just the filename from the disposition header
    const filenameMatch = disposition.match(/filename="([^"]+)"/);
    expect(filenameMatch).toBeTruthy();
    const sanitizedFilename = filenameMatch![1];
    expect(sanitizedFilename).not.toContain('!');
    expect(sanitizedFilename).not.toContain('@');
    expect(sanitizedFilename).not.toContain('#');
    expect(sanitizedFilename).not.toContain(' ');
  });

  it('returns 502 when upstream fails', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      body: null,
      status: 500,
      headers: new Headers(),
    });

    const req = makeRequest({
      url: 'https://radshift-bucket.s3.amazonaws.com/missing.png',
    });
    const res = await GET(req);
    expect(res.status).toBe(502);
    const body = await res.json();
    expect(body.error).toContain('Upstream error');
  });

  it('uses default filename "download" when not provided', async () => {
    const mockBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      status: 200,
      headers: new Headers({
        'content-type': 'application/octet-stream',
      }),
    });

    const req = makeRequest({
      url: 'https://radshift-bucket.s3.amazonaws.com/file',
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Disposition')).toContain('download');
  });

  it('forwards cache-control header from upstream', async () => {
    const mockBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data'));
        controller.close();
      },
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      status: 200,
      headers: new Headers({
        'content-type': 'image/jpeg',
        'cache-control': 'public, max-age=86400',
      }),
    });

    const req = makeRequest({
      url: 'https://radshift-bucket.s3.amazonaws.com/pic.jpg',
    });
    const res = await GET(req);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=86400');
  });
});
