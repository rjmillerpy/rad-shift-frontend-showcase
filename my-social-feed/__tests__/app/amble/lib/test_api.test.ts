import { AmbleApiError, ambleGet, amblePost, amblePut } from "@/app/amble/lib/api";
import api from "@/lib/api";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
    defaults: { baseURL: "", headers: { common: {} } },
  },
}));

const mockedApi = api as jest.Mocked<typeof api>;

function axiosErrorLike(status?: number, code?: string) {
  return {
    code,
    response: status ? { status, data: {} } : undefined,
    isAxiosError: true,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  (console.error as jest.Mock).mockRestore?.();
});

describe("ambleGet — happy path", () => {
  it("returns response.data on 200", async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { hello: "world" } });
    await expect(ambleGet("/x")).resolves.toEqual({ hello: "world" });
  });
});

describe("classification — non-retryable failures", () => {
  it.each<[string, unknown, AmbleApiError["code"]]>([
    ["401 unauthorized", axiosErrorLike(401), "unauthorized"],
    ["403 forbidden",    axiosErrorLike(403), "forbidden"],
    ["404 not found",    axiosErrorLike(404), "not_found"],
    ["400 validation",   axiosErrorLike(400), "validation"],
    ["422 validation",   axiosErrorLike(422), "validation"],
  ])("%s throws AmbleApiError immediately without retry", async (_name, err, code) => {
    mockedApi.get.mockRejectedValueOnce(err);
    const call = ambleGet("/x").catch((e) => e);
    const caught = await call;
    expect(caught).toBeInstanceOf(AmbleApiError);
    expect((caught as AmbleApiError).code).toBe(code);
    expect(mockedApi.get).toHaveBeenCalledTimes(1);
  });
});

describe("classification — retryable failures", () => {
  it("500 retries then throws server", async () => {
    mockedApi.get.mockRejectedValue(axiosErrorLike(500));
    const caught = await ambleGet("/x").catch((e) => e);
    expect(caught).toBeInstanceOf(AmbleApiError);
    expect((caught as AmbleApiError).code).toBe("server");
    expect(mockedApi.get.mock.calls.length).toBeGreaterThan(1);
  });

  it("timeout code ECONNABORTED classifies as timeout and retries", async () => {
    mockedApi.get.mockRejectedValue(axiosErrorLike(undefined, "ECONNABORTED"));
    const caught = await ambleGet("/x").catch((e) => e);
    expect((caught as AmbleApiError).code).toBe("timeout");
    expect(mockedApi.get.mock.calls.length).toBeGreaterThan(1);
  });

  it("no response classifies as network", async () => {
    mockedApi.get.mockRejectedValue(axiosErrorLike());
    const caught = await ambleGet("/x").catch((e) => e);
    expect((caught as AmbleApiError).code).toBe("network");
  });

  it("succeeds on the retry when the second call resolves", async () => {
    mockedApi.get
      .mockRejectedValueOnce(axiosErrorLike(503))
      .mockResolvedValueOnce({ data: { ok: true } });
    await expect(ambleGet("/x")).resolves.toEqual({ ok: true });
    expect(mockedApi.get).toHaveBeenCalledTimes(2);
  });
});

describe("amblePut retries idempotently", () => {
  it("passes body to the underlying client", async () => {
    mockedApi.put.mockResolvedValueOnce({ data: { saved: true } });
    await expect(amblePut("/x", { foo: 1 })).resolves.toEqual({ saved: true });
    expect(mockedApi.put).toHaveBeenCalledWith("/x", { foo: 1 }, expect.objectContaining({ timeout: expect.any(Number) }));
  });
});

describe("amblePost does NOT retry", () => {
  it("throws on first server error without retrying", async () => {
    mockedApi.post.mockRejectedValueOnce(axiosErrorLike(500));
    const caught = await amblePost("/x", {}).catch((e) => e);
    expect(caught).toBeInstanceOf(AmbleApiError);
    expect(mockedApi.post).toHaveBeenCalledTimes(1);
  });
});

describe("AmbleApiError metadata", () => {
  it("propagates entityId through GET errors", async () => {
    mockedApi.get.mockRejectedValueOnce(axiosErrorLike(404));
    const caught = await ambleGet("/x", "npc_42").catch((e) => e);
    expect((caught as AmbleApiError).entityId).toBe("npc_42");
  });
});
