/**
 * Tests for src/lib/api.ts — centralized Axios instance with auth + 401 redirect.
 *
 * Note: jsdom's window.location is non-configurable in this runtime version,
 * so the redirect side-effect (href = "/login") is not asserted directly.
 * All other interceptor behavior (baseURL, token attach, 401 token clear,
 * non-401 pass-through) is covered.
 */

const mockRequestInterceptor = jest.fn();
const mockResponseInterceptor = jest.fn();

const mockAxiosInstance = {
  interceptors: {
    request: { use: mockRequestInterceptor },
    response: { use: mockResponseInterceptor },
  },
  defaults: { baseURL: "" },
};

jest.mock("axios", () => ({
  __esModule: true,
  default: { create: jest.fn(() => mockAxiosInstance) },
}));

jest.mock("@/lib/config", () => ({ API_URL: "http://mock-api.test" }));


describe("api client", () => {
  beforeEach(() => {
    jest.resetModules();
    mockRequestInterceptor.mockClear();
    mockResponseInterceptor.mockClear();
    localStorage.clear();
  });

  async function loadApiModule() {
    await import("@/lib/api");
    const reqCallback = mockRequestInterceptor.mock.calls[0][0] as (c: Record<string, unknown>) => Record<string, unknown>;
    const [respSuccess, respError] = mockResponseInterceptor.mock.calls[0] as [
      (r: unknown) => unknown,
      (e: unknown) => unknown,
    ];
    return { reqCallback, respSuccess, respError };
  }

  test("sets baseURL to API_URL from config", async () => {
    await loadApiModule();
    const axios = (await import("axios")).default;
    expect((axios.create as jest.Mock)).toHaveBeenCalledWith({
      baseURL: "http://mock-api.test",
    });
  });

  test("request interceptor attaches Bearer token from localStorage", async () => {
    localStorage.setItem("token", "abc123");
    const { reqCallback } = await loadApiModule();

    const config = { headers: {} as Record<string, string> };
    const result = reqCallback(config) as typeof config;

    expect(result.headers.Authorization).toBe("Bearer abc123");
  });

  test("request interceptor skips auth header when no token", async () => {
    const { reqCallback } = await loadApiModule();
    const config = { headers: {} as Record<string, string> };
    const result = reqCallback(config) as typeof config;
    expect(result.headers.Authorization).toBeUndefined();
  });

  test("response interceptor passes successful responses through", async () => {
    const { respSuccess } = await loadApiModule();
    const result = respSuccess({ data: "ok" });
    expect(result).toEqual({ data: "ok" });
  });

  test("401 response clears token and email_verified from localStorage", async () => {
    // window.location redirect is not asserted here (jsdom limitation);
    // the token-clearing half of the invariant is the observable one.
    localStorage.setItem("token", "expired");
    localStorage.setItem("email_verified", "true");
    const { respError } = await loadApiModule();

    const error = { response: { status: 401 } };
    // The interceptor triggers a real navigation in jsdom; swallow that
    try {
      await respError(error);
    } catch {
      // expected — we're inspecting side effects, not the rejection chain
    }

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("email_verified")).toBeNull();
  });

  test.each([403, 404, 500, 502])(
    "non-401 status %s does not clear the token",
    async (status) => {
      localStorage.setItem("token", "still-good");
      const { respError } = await loadApiModule();

      const error = { response: { status } };
      await expect(respError(error)).rejects.toBe(error);

      expect(localStorage.getItem("token")).toBe("still-good");
    },
  );

  test("errors without a response object still reject", async () => {
    const { respError } = await loadApiModule();
    const error = new Error("network down");
    await expect(respError(error)).rejects.toBe(error);
  });
});
