/**
 * DialogueFrame: opens on INTERACT_EVENT, shows loading then the resolved
 * content, advances with Space, closes with Enter / Escape.
 *
 * Nothing internal is mocked: content comes from the real handler registry
 * and the stub content client (120ms simulated latency, driven with fake
 * timers). `@/lib/api` is mocked only so the engagement bar has no network.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import DialogueFrame from "@/app/amble/ui/DialogueFrame";
import {
  DIALOGUE_CLOSE_EVENT,
  DIALOGUE_OPEN_EVENT,
  INTERACT_EVENT,
} from "@/app/amble/data/constants";
import type { EntityAnchor } from "@/app/amble/data/schema";
import { registerHandler } from "@/app/amble/systems/handlers";
import { TOWN } from "@/app/amble/data/town";

// Canned posts come from the town (data/town.ts): read the expectations from it.
const CORPUS = Object.entries(TOWN.stubPosts);
const WANDERER = TOWN.stubPosts.wanderer.map((post) => `@${post.author}`);
const LAST = WANDERER[WANDERER.length - 1];
const [SINGLE_ID, [SINGLE]] = CORPUS.find(([, posts]) => posts.length === 1)!;
const [OTHER_ID, [OTHER]] = CORPUS.find(([id]) => id !== "wanderer")!;

jest.mock("@/lib/api");

const LATENCY_MS = 120;
const anchor = (id: string, type: EntityAnchor["type"] = "npc"): EntityAnchor => ({
  id, type, position: { tileX: 0, tileY: 0 },
});

const interact = (entity: EntityAnchor) =>
  act(() => {
    window.dispatchEvent(new CustomEvent(INTERACT_EVENT, { detail: { entity } }));
  });
const advance = (ms: number = LATENCY_MS) =>
  act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
  });
const press = (key: string) => fireEvent.keyDown(window, { key });
const open = async (entity: EntityAnchor) => {
  interact(entity);
  await advance();
};
const speaker = () => screen.getByTestId("amble-dialogue-speaker").textContent;
const hint = () => screen.getByTestId("amble-dialogue-hint").textContent;

describe("DialogueFrame", () => {
  const onOpen = jest.fn();
  const onClose = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    onOpen.mockClear();
    onClose.mockClear();
    window.addEventListener(DIALOGUE_OPEN_EVENT, onOpen);
    window.addEventListener(DIALOGUE_CLOSE_EVENT, onClose);
  });

  afterEach(() => {
    window.removeEventListener(DIALOGUE_OPEN_EVENT, onOpen);
    window.removeEventListener(DIALOGUE_CLOSE_EVENT, onClose);
    jest.useRealTimers();
  });

  it("stays hidden until an interact event names an entity", () => {
    render(<DialogueFrame />);
    act(() => {
      window.dispatchEvent(new CustomEvent(INTERACT_EVENT));
      window.dispatchEvent(new CustomEvent(INTERACT_EVENT, { detail: {} }));
    });
    expect(screen.queryByTestId("amble-dialogue-frame")).not.toBeInTheDocument();
    expect(onOpen).not.toHaveBeenCalled();
  });

  it("opens in a loading state and announces it, then shows the content", async () => {
    render(<DialogueFrame />);
    interact(anchor(SINGLE_ID, "object"));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("amble-dialogue-loading")).toHaveTextContent("Loading…");
    expect(hint()).toBe("Enter / Esc to close");

    await advance();

    expect(screen.queryByTestId("amble-dialogue-loading")).not.toBeInTheDocument();
    expect(speaker()).toBe(`@${SINGLE.author}`);
    expect(screen.getByTestId("amble-dialogue-post-text")).toHaveTextContent(SINGLE.text);
    expect(screen.getByTestId("amble-dialogue-post-timestamp")).toHaveTextContent("2023");
    expect(screen.getByTestId("amble-engagement-like")).toHaveTextContent("♡0");
    // Single-post feed: no next cursor, so no advance prompt.
    expect(hint()).toBe("Enter / Esc to close");
  });

  it("shows a handler's line for an entity with a specific handler", async () => {
    render(<DialogueFrame />);
    await open(anchor("train-station", "building"));

    expect(speaker()).toBe("Station Attendant");
    expect(screen.getByTestId("amble-dialogue-text")).toHaveTextContent("Line's not running yet");
    expect(hint()).toBe("Enter / Esc to close");
  });

  it.each([
    ["npc", "…", "They give a small wave and keep to themselves today."],
    ["sign", "Sign", "The board is empty — nothing new posted yet."],
    ["building", "You look inside", "It's quiet today. Nobody's around."],
    ["object", "You look closer", "Nothing much to see right now."],
  ] as const)("shows the %s empty state when the entity has no content", async (type, who, text) => {
    render(<DialogueFrame />);
    await open(anchor(`nothing-bound-${type}`, type));

    expect(speaker()).toBe(who);
    expect(screen.getByTestId("amble-dialogue-empty")).toHaveTextContent(text);
    expect(screen.queryByTestId("amble-engagement-bar")).not.toBeInTheDocument();
  });

  it("shows the error state when resolving the interaction throws", async () => {
    registerHandler("broken-entity", () => {
      throw new Error("handler blew up");
    });
    render(<DialogueFrame />);
    await open(anchor("broken-entity"));

    expect(screen.getByTestId("amble-dialogue-error")).toHaveTextContent(
      "Something went wrong. Try again in a moment.",
    );
    press("Enter");
    expect(screen.queryByTestId("amble-dialogue-frame")).not.toBeInTheDocument();
  });

  it("advances with Space while there is a next cursor, and not after", async () => {
    render(<DialogueFrame />);
    await open(anchor("wanderer"));
    expect(speaker()).toBe(WANDERER[0]);
    expect(hint()).toBe("Space for nextEnter / Esc to close");

    press(" ");
    expect(screen.getByTestId("amble-dialogue-loading")).toBeInTheDocument();
    await advance();
    expect(speaker()).toBe(WANDERER[1]);

    for (const author of WANDERER.slice(2)) {
      press(" ");
      await advance();
      expect(speaker()).toBe(author);
    }
    expect(hint()).toBe("Enter / Esc to close");

    press(" ");
    expect(screen.queryByTestId("amble-dialogue-loading")).not.toBeInTheDocument();
    await advance();
    expect(speaker()).toBe(LAST);
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it.each(["Enter", "Escape"])("closes on %s and announces it", async (closeKey) => {
    render(<DialogueFrame />);
    await open(anchor("wanderer"));

    press("a");
    expect(screen.getByTestId("amble-dialogue-frame")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    press(closeKey);
    expect(screen.queryByTestId("amble-dialogue-frame")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);

    // Closed: further keys are not the frame's business.
    press(closeKey);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays closed when closed mid-load, even after the content arrives", async () => {
    render(<DialogueFrame />);
    interact(anchor("wanderer"));
    press("Escape");
    await advance();

    expect(screen.queryByTestId("amble-dialogue-frame")).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("remembers the cursor per entity so re-interacting shows the next post", async () => {
    render(<DialogueFrame />);
    await open(anchor("wanderer"));
    expect(speaker()).toBe(WANDERER[0]);
    press("Enter");

    await open(anchor(OTHER_ID, "sign"));
    expect(screen.getByTestId("amble-dialogue-post-text")).toHaveTextContent(OTHER.text);
    press("Enter");

    for (const author of WANDERER.slice(1)) {
      await open(anchor("wanderer"));
      expect(speaker()).toBe(author);
      press("Enter");
    }

    // The feed ran out (null cursor), so the next visit starts over.
    await open(anchor("wanderer"));
    expect(speaker()).toBe(WANDERER[0]);
    expect(onOpen).toHaveBeenCalledTimes(WANDERER.length + 2);
    expect(onClose).toHaveBeenCalledTimes(WANDERER.length + 1);
  });

  it("drops a slow response for an entity the player has moved on from", async () => {
    render(<DialogueFrame />);
    interact(anchor(SINGLE_ID, "object"));
    await advance(50);
    interact(anchor("wanderer"));

    await advance(LATENCY_MS - 50); // the first entity's response lands here
    expect(screen.getByTestId("amble-dialogue-loading")).toBeInTheDocument();

    await advance(50);
    expect(speaker()).toBe(WANDERER[0]);
  });

  it("stops listening once unmounted", () => {
    const { unmount } = render(<DialogueFrame />);
    unmount();
    interact(anchor("wanderer"));
    press("Enter");
    expect(onOpen).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(jest.getTimerCount()).toBe(0);
  });
});
