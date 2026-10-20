/**
 * @jest-environment node
 */

const mockFetch = jest.fn();
global.fetch = mockFetch;

import { GET } from "@/app/api/chronicle/stream/route";
import { NextRequest } from "next/server";

function makeRequest(params: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const url = new URL("http://localhost:3000/api/chronicle/stream");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new NextRequest(url.toString(), { headers });
}

beforeEach(() => { jest.clearAllMocks(); });

describe("/api/chronicle/stream", () => {
  it("proxies request to backend with query params", async () => {
    const mockBody = new ReadableStream();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      headers: new Headers({ "content-type": "text/event-stream" }),
    });

    const req = makeRequest({ page: "1", posts_per_page: "10" });
    const res = await GET(req);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/posts/chronicle/stream?page=1&posts_per_page=10"),
      expect.any(Object)
    );
    expect(res.status).toBe(200);
  });

  it("calls the backend at the server-side API URL", async () => {
    jest.resetModules();
    process.env.API_INTERNAL_URL = "http://backend:5000";
    try {
      const { GET: isolatedGet } = require("@/app/api/chronicle/stream/route");
      mockFetch.mockResolvedValueOnce({ ok: true, body: new ReadableStream(), headers: new Headers() });

      await isolatedGet(makeRequest());

      expect(mockFetch.mock.calls[0][0]).toMatch(/^http:\/\/backend:5000\/posts\/chronicle\/stream\?/);
    } finally {
      delete process.env.API_INTERNAL_URL;
    }
  });

  it("returns SSE content type", async () => {
    const mockBody = new ReadableStream();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      headers: new Headers({ "content-type": "text/event-stream" }),
    });

    const req = makeRequest();
    const res = await GET(req);

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("Connection")).toBe("keep-alive");
  });

  it("returns 502 when backend is unavailable", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      body: null,
      headers: new Headers(),
    });

    const req = makeRequest();
    const res = await GET(req);

    expect(res.status).toBe(502);
  });

  it("forwards authorization header to backend", async () => {
    const mockBody = new ReadableStream();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      headers: new Headers(),
    });

    const req = makeRequest({}, { authorization: "Bearer test-token" });
    await GET(req);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { Authorization: "Bearer test-token" } })
    );
  });

  it("uses default page and posts_per_page when not provided", async () => {
    const mockBody = new ReadableStream();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      body: mockBody,
      headers: new Headers(),
    });

    const req = makeRequest();
    await GET(req);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=0&posts_per_page=12"),
      expect.any(Object)
    );
  });
});
