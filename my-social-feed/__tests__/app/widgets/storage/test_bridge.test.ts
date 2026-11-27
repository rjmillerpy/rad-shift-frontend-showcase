/**
 * The page's half of widget storage. Only the HTTP client is mocked; the
 * iframe is a stand-in window whose postMessage records the answers.
 */
import api from "@/lib/api";
import {
  REQUEST_TYPE,
  RESULT_TYPE,
  apiStore,
  memoryStore,
  signedOutStore,
  storageListener,
} from "@/app/widgets/storage/bridge";

jest.mock("@/lib/api", () => ({
  __esModule: true,
  default: { get: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));
const mockedApi = api as jest.Mocked<typeof api>;

function frame() {
  return { postMessage: jest.fn() } as unknown as Window & { postMessage: jest.Mock };
}

async function send(listener: (e: MessageEvent) => void, source: unknown, data: unknown) {
  listener({ source, data } as MessageEvent);
  await new Promise((resolve) => setTimeout(resolve, 0));
}

const request = (op: string, key?: string, value?: unknown) => ({ type: REQUEST_TYPE, id: 7, op, key, value });

beforeEach(() => jest.resetAllMocks());

describe("storageListener", () => {
  it("answers its own iframe: set, then get, keys and remove", async () => {
    const widget = frame();
    const listener = storageListener(() => widget, memoryStore());

    await send(listener, widget, request("set", "best", { score: 9 }));
    await send(listener, widget, request("get", "best"));
    await send(listener, widget, request("keys"));
    await send(listener, widget, request("remove", "best"));

    const answers = widget.postMessage.mock.calls.map(([message]) => message);
    expect(answers.map((a) => a.ok)).toEqual([true, true, true, true]);
    expect(answers[1]).toEqual({ type: RESULT_TYPE, id: 7, ok: true, value: { score: 9 } });
    expect(answers[2].value).toEqual(["best"]);
    expect(widget.postMessage).toHaveBeenCalledWith(expect.anything(), "*");
  });

  it("ignores messages from any other window, so a widget reaches only its own keys", async () => {
    const widget = frame();
    const other = frame();
    await send(storageListener(() => widget, memoryStore()), other, request("keys"));
    expect(widget.postMessage).not.toHaveBeenCalled();
    expect(other.postMessage).not.toHaveBeenCalled();
  });

  it.each([
    ["not an object", "hello"],
    ["another message type", { type: "other", id: 1, op: "keys" }],
    ["an unknown op", { type: REQUEST_TYPE, id: 1, op: "drop" }],
    ["no id", { type: REQUEST_TYPE, op: "keys" }],
  ])("ignores %s", async (_name, data) => {
    const widget = frame();
    await send(storageListener(() => widget, memoryStore()), widget, data);
    expect(widget.postMessage).not.toHaveBeenCalled();
  });

  it("refuses a key outside the API's rules", async () => {
    const widget = frame();
    await send(storageListener(() => widget, memoryStore()), widget, request("set", "has space", 1));
    expect(widget.postMessage.mock.calls[0][0]).toMatchObject({ ok: false, error: expect.stringMatching(/Keys are/) });
  });

  it("tells a signed-out viewer's widget why it can't save", async () => {
    const widget = frame();
    await send(storageListener(() => widget, signedOutStore()), widget, request("get", "k"));
    expect(widget.postMessage.mock.calls[0][0]).toMatchObject({ ok: false, error: "Sign in to save widget data" });
  });

  it("passes the API's reason through when a save is refused", async () => {
    const widget = frame();
    mockedApi.put.mockRejectedValue({ isAxiosError: true, response: { status: 413, data: { detail: "too big" } } });
    await send(storageListener(() => widget, apiStore(3)), widget, request("set", "k", "x"));
    expect(widget.postMessage.mock.calls[0][0]).toMatchObject({ ok: false, error: "too big" });
  });
});

describe("apiStore", () => {
  it("calls the widget's storage endpoints", async () => {
    const store = apiStore(3);
    mockedApi.get.mockResolvedValueOnce({ data: { key: "k", value: 1 } });
    mockedApi.get.mockResolvedValueOnce({ data: { items: { k: 1, j: 2 } } });

    expect(await store.get("k")).toBe(1);
    expect(await store.keys()).toEqual(["k", "j"]);
    await store.set("k", 2);
    await store.remove("k");

    expect(mockedApi.get).toHaveBeenNthCalledWith(1, "/widgets/3/storage/k");
    expect(mockedApi.put).toHaveBeenCalledWith("/widgets/3/storage/k", { value: 2 });
    expect(mockedApi.delete).toHaveBeenCalledWith("/widgets/3/storage/k");
  });

  it("reads a missing key as undefined", async () => {
    mockedApi.get.mockRejectedValue({ isAxiosError: true, response: { status: 404, data: {} } });
    expect(await apiStore(3).get("never-set")).toBeUndefined();
  });
});
