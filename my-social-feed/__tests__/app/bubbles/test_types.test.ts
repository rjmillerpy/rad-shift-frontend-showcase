/**
 * src/app/bubbles/types.ts exports types only (no runtime values), so these
 * tests build one realistic fixture per exported type (checked by `tsc`) and
 * verify the discriminated union can be narrowed on its `type` tag.
 */
import type {
  Bubble,
  BubbleSettings,
  NavHistoryEntry,
  OrbitItem,
  ProfileBubbleState,
  TopicDef,
  ViewportSize,
} from "@/app/bubbles/types";
import type { Post } from "@/types/post";

const post: Post = {
  id: 7, text: "Rust compiles fast", username: "alice",
  likes: 1, reposts: 0, shares: 0, saves: 0, laughs: 0, unix_timestamp: 1700000000,
};

const feedTopic: TopicDef = { label: "Algo", color: "#007bff", isFeed: true, tab: "algo" };
const plainTopic: TopicDef = { label: "Technology", color: "#e74c3c" };
const bubble: Bubble = { label: "Music", color: "#e67e22", isFeed: false, x: 10, y: 20, vx: 0.2, vy: -0.1, size: 80 };
const settings: BubbleSettings = { custom_topics: ["Knitting"], hidden_topics: ["Sports"] };
const viewport: ViewportSize = { w: 1280, h: 720 };
const profile: ProfileBubbleState = { x: 100, y: 100, vx: 0.2, vy: 0.15 };

const orbitItems: OrbitItem[] = [
  { type: "back", label: "Back" },
  { type: "balloon", label: "🎈" },
  { type: "paginate", label: "More" },
  { type: "subcategory", label: "Rust", tag: "rust" },
  { type: "micro", label: "AI", tag: "AI" },
  { type: "post", label: post.text, post },
];

/** Narrowing helper: only compiles if every union member is handled. */
function payloadOf(item: OrbitItem): string | number | null {
  switch (item.type) {
    case "back":
    case "balloon":
    case "paginate":
      return null;
    case "subcategory":
    case "micro":
      return item.tag;
    case "post":
      return item.post.id;
  }
}

describe("bubbles types", () => {
  it.each([
    ["back", null],
    ["balloon", null],
    ["paginate", null],
    ["subcategory", "rust"],
    ["micro", "AI"],
    ["post", 7],
  ] as const)("OrbitItem of type %s narrows to its own payload (%s)", (type, expected) => {
    const item = orbitItems.find((it) => it.type === type);
    expect(item).toBeDefined();
    expect(payloadOf(item!)).toBe(expected);
  });

  it("covers every OrbitItem variant exactly once in the fixture", () => {
    const types = orbitItems.map((it) => it.type);
    expect(new Set(types).size).toBe(types.length);
    expect(types).toHaveLength(6);
  });

  it("TopicDef allows feed topics with a tab and plain topics without one", () => {
    expect(feedTopic.isFeed).toBe(true);
    expect(feedTopic.tab).toBe("algo");
    expect(plainTopic.isFeed).toBeUndefined();
    expect(plainTopic.tab).toBeUndefined();
  });

  it("NavHistoryEntry models overview, topic and post steps", () => {
    const history: NavHistoryEntry[] = [
      { topic: null, post: null },
      { topic: plainTopic, post: null },
      { topic: plainTopic, post },
    ];
    expect(history.map((h) => (h.post ? "post" : h.topic ? "topic" : "overview")))
      .toEqual(["overview", "topic", "post"]);
  });

  it("Bubble and ProfileBubbleState share the drifter fields", () => {
    const drifters: Array<Pick<Bubble, "x" | "y" | "vx" | "vy">> = [bubble, profile];
    for (const d of drifters) {
      expect([d.x, d.y, d.vx, d.vy].every((n) => Number.isFinite(n))).toBe(true);
    }
  });

  it("BubbleSettings and ViewportSize fixtures keep their shape", () => {
    expect(settings).toEqual({ custom_topics: ["Knitting"], hidden_topics: ["Sports"] });
    expect(viewport.w * viewport.h).toBe(921600);
  });
});
