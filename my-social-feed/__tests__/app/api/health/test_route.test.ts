/**
 * @jest-environment node
 */

/**
 * Tests for /api/health route handler
 */

import { GET, dynamic } from '@/app/api/health/route';

describe('/api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('is never cached', () => {
    expect(GET().headers.get('Cache-Control')).toBe('no-store');
    expect(dynamic).toBe('force-dynamic');
  });

  it('does not depend on the backend', async () => {
    const mockFetch = jest.fn();
    global.fetch = mockFetch;
    GET();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
