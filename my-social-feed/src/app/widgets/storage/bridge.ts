/**
 * The page's half of widget storage (radshift.storage in a widget).
 *
 * A widget runs in a sandboxed iframe with an opaque origin, where the
 * browser refuses localStorage. Its SDK (served by the API at
 * /widgets/sdk.js) posts requests to this page; the bridge answers them from
 * a store: the API, with the viewer's login, on a widget's page; memory in the
 * editor's preview.
 *
 * Which widget is asking is decided here, from the iframe the message came
 * from, never from anything in the message, so a widget can only reach its
 * own keys. The widget never sees the login.
 */
import axios from "axios";
import api from "@/lib/api";

export const REQUEST_TYPE = "radshift:storage";
export const RESULT_TYPE = "radshift:storage:result";
// Same rule as the API (app/widgets/constants.py): letters, digits, _ . : -
const KEY_PATTERN = /^[A-Za-z0-9_.:-]{1,64}$/;
const SIGNED_OUT = "Sign in to save widget data";

export interface WidgetStore {
  get(key: string): Promise<unknown>;
  set(key: string, value: unknown): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

type Op = "get" | "set" | "remove" | "keys";
interface StorageRequest { type: string; id: number; op: Op; key?: string; value?: unknown }

function isRequest(data: unknown): data is StorageRequest {
  if (typeof data !== "object" || data === null) return false;
  const message = data as Partial<StorageRequest>;
  return message.type === REQUEST_TYPE && typeof message.id === "number"
    && ["get", "set", "remove", "keys"].includes(message.op as string);
}

/** Saves through the API for the signed-in viewer. A missing key reads as undefined. */
export function apiStore(widgetId: number): WidgetStore {
  const base = `/widgets/${widgetId}/storage`;
  const keyUrl = (key: string) => `${base}/${encodeURIComponent(key)}`;
  return {
    async get(key) {
      try {
        return (await api.get(keyUrl(key))).data.value;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return undefined;
        throw error;
      }
    },
    async set(key, value) { await api.put(keyUrl(key), { value }); },
    async remove(key) { await api.delete(keyUrl(key)); },
    async keys() { return Object.keys((await api.get(base)).data.items); },
  };
}

/** For the editor's preview: nothing is saved past the page. */
export function memoryStore(): WidgetStore {
  const values = new Map<string, unknown>();
  return {
    async get(key) { return values.get(key); },
    async set(key, value) { values.set(key, value); },
    async remove(key) { values.delete(key); },
    async keys() { return [...values.keys()]; },
  };
}

/** For anonymous viewers: every call fails with a reason the widget can show. */
export function signedOutStore(): WidgetStore {
  const refuse = () => Promise.reject(new Error(SIGNED_OUT));
  return { get: refuse, set: refuse, remove: refuse, keys: refuse };
}

function errorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
  }
  return error instanceof Error ? error.message : "Storage failed";
}

async function run(store: WidgetStore, request: StorageRequest): Promise<unknown> {
  if (request.op === "keys") return store.keys();
  if (typeof request.key !== "string" || !KEY_PATTERN.test(request.key)) {
    throw new Error("Keys are 1-64 characters: letters, digits, _ . : -");
  }
  if (request.op === "get") return store.get(request.key);
  if (request.op === "set") return store.set(request.key, request.value);
  return store.remove(request.key);
}

/** The window "message" listener for one widget iframe; answers only that iframe. */
export function storageListener(
  frame: () => Window | null | undefined,
  store: WidgetStore,
): (event: MessageEvent) => void {
  return (event) => {
    const source = frame();
    if (!source || event.source !== source || !isRequest(event.data)) return;
    const { id } = event.data;
    run(store, event.data).then(
      (value) => source.postMessage({ type: RESULT_TYPE, id, ok: true, value }, "*"),
      (error) => source.postMessage({ type: RESULT_TYPE, id, ok: false, error: errorText(error) }, "*"),
    );
  };
}
