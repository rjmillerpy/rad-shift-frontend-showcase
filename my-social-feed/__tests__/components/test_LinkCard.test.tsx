import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import LinkCard from "@/components/LinkCard";

jest.mock("@/lib/utils", () => ({ proxyIfNeeded: (u: string) => u }));

describe("LinkCard", () => {
  it("renders nothing without a url", () => {
    // @ts-expect-error — passing a malformed payload on purpose
    const { container } = render(<LinkCard linkCard={{ url: undefined }} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title, hostname, and image", () => {
    render(
      <LinkCard
        linkCard={{
          url: "https://example.com/x",
          title: "A great post",
          image: "https://img.example.com/a.jpg",
          hostname: "example.com",
        }}
      />
    );
    expect(screen.getByText("A great post")).toBeInTheDocument();
    expect(screen.getByText("example.com")).toBeInTheDocument();
    expect(screen.getByText("Open ↗")).toBeInTheDocument();
    const img = screen.getByAltText("A great post") as HTMLImageElement;
    expect(img.src).toBe("https://img.example.com/a.jpg");
  });

  it("omits image when not provided", () => {
    render(
      <LinkCard
        linkCard={{ url: "https://example.com/x", title: "T", hostname: "example.com" }}
      />
    );
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  describe("platform themes", () => {
    test.each<{
      themeId: string;
      platform: string;
      hostname: string;
      sourceName: string;
      expectedBadge: string;
      expectedDisplay: string;
      expectedCta: string;
    }>([
      {
        themeId: "reddit",
        platform: "reddit",
        hostname: "reddit.com",
        sourceName: "r/python",
        expectedBadge: "r/",
        expectedDisplay: "r/python",
        expectedCta: "Open on Reddit",
      },
      {
        themeId: "pinterest",
        platform: "pinterest",
        hostname: "pinterest.com",
        sourceName: "alice pins",
        expectedBadge: "P",
        expectedDisplay: "alice pins",
        expectedCta: "Open on Pinterest",
      },
      {
        themeId: "hackernews",
        platform: "web",
        hostname: "news.ycombinator.com",
        sourceName: "Ycomb News",
        expectedBadge: "Y",
        expectedDisplay: "Ycomb News",
        expectedCta: "Open on Hacker News",
      },
    ])(
      "renders $themeId theme with badge '$expectedBadge' and CTA",
      ({ platform, hostname, sourceName, expectedBadge, expectedDisplay, expectedCta }) => {
        render(
          <LinkCard
            linkCard={{
              url: "https://example.com/post",
              title: "Some post",
              hostname,
            }}
            source={{
              platform,
              name: sourceName,
              url: `https://${hostname}`,
              label: `${expectedDisplay}`,
            }}
          />,
        );
        expect(screen.getByText(expectedBadge)).toBeInTheDocument();
        expect(screen.getByText(expectedDisplay)).toBeInTheDocument();
        expect(screen.getByText(new RegExp(expectedCta))).toBeInTheDocument();
      },
    );

    it("generic theme falls back to first letter of hostname for the badge", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://example.com/post",
            title: "Some post",
            hostname: "elsewhere.example.com",
          }}
          source={{
            platform: "web",
            name: "Random Blog",
            url: "https://elsewhere.example.com",
            label: "Random Blog",
          }}
        />,
      );
      expect(screen.getByText("E")).toBeInTheDocument();
      expect(screen.getByText("Open ↗")).toBeInTheDocument();
    });
  });

  it("opens the original in a new tab with rel='noopener noreferrer'", () => {
    render(
      <LinkCard linkCard={{ url: "https://example.com/x", title: "T", hostname: "ex" }} />
    );
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveAttribute("href", "https://example.com/x");
  });

  it("stops click propagation so it doesn't trigger the parent post link", () => {
    const parentClick = jest.fn();
    render(
      <div onClick={parentClick}>
        <LinkCard
          linkCard={{ url: "https://example.com/x", title: "T", hostname: "ex" }}
        />
      </div>
    );
    fireEvent.click(screen.getByRole("link"));
    expect(parentClick).not.toHaveBeenCalled();
  });

  it("truncates long titles", () => {
    const longTitle = "x".repeat(200);
    render(
      <LinkCard linkCard={{ url: "https://example.com/x", title: longTitle, hostname: "ex" }} />
    );
    const titleEl = screen.getByText(/^x+…$/);
    expect(titleEl.textContent!.length).toBeLessThanOrEqual(141); // 140 chars + ellipsis
  });

  describe("bodyText prop", () => {
    it("renders the body inside the card when provided", () => {
      render(
        <LinkCard
          linkCard={{ url: "https://example.com/x", title: "T", hostname: "ex" }}
          bodyText="A summary of the article goes here."
        />,
      );
      expect(screen.getByText("A summary of the article goes here.")).toBeInTheDocument();
    });

    it("renders nothing for empty / whitespace-only bodyText", () => {
      render(
        <LinkCard
          linkCard={{ url: "https://example.com/x", title: "T", hostname: "ex" }}
          bodyText="   "
        />,
      );
      // The trimmed description is empty so no description paragraph renders.
      // (Title still renders as before.)
      expect(screen.getByText("T")).toBeInTheDocument();
    });

    it("preserves line breaks via white-space: pre-wrap", () => {
      render(
        <LinkCard
          linkCard={{ url: "https://example.com/x", title: "T", hostname: "ex" }}
          bodyText={"line one\nline two"}
        />,
      );
      const desc = screen.getByText(/line one[\s\S]*line two/);
      expect(desc).toHaveStyle({ whiteSpace: "pre-wrap" });
    });
  });

  describe("title vs body redundancy", () => {
    const SHARED_PINTEREST_TEXT =
      "Four astronauts will fly around the Moon and back on Artemis II, the first crewed flight under NASA's Artemis campaign.";

    it("suppresses the title when it duplicates the body (Pinterest case)", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://www.pinterest.com/pin/1",
            title: SHARED_PINTEREST_TEXT,
            hostname: "pinterest.com",
          }}
          bodyText={SHARED_PINTEREST_TEXT}
        />,
      );
      // The body is rendered exactly once — not duplicated as both title and body.
      const matches = screen.queryAllByText(SHARED_PINTEREST_TEXT);
      expect(matches.length).toBe(1);
    });

    it("keeps the title when it's distinct from the body (Reddit case)", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://reddit.com/r/python/comments/1",
            title: "Show off your favorite Python tip",
            hostname: "reddit.com",
          }}
          bodyText="I've been using f-string debug syntax since 3.8 and it's a game changer."
        />,
      );
      expect(screen.getByText("Show off your favorite Python tip")).toBeInTheDocument();
      expect(screen.getByText(/f-string debug syntax/)).toBeInTheDocument();
    });

    it("keeps a short title even if it overlaps the body start", () => {
      // Short titles (< 20 chars) are never treated as redundant; they're cheap to show.
      render(
        <LinkCard
          linkCard={{
            url: "https://example.com/x",
            title: "Hello",
            hostname: "example.com",
          }}
          bodyText="Hello, this is the body"
        />,
      );
      expect(screen.getByText("Hello")).toBeInTheDocument();
    });
  });

  describe("new tab", () => {
    it("opens the card link with target=_blank and rel=noopener noreferrer", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://reddit.com/r/python/comments/1",
            title: "T",
            hostname: "reddit.com",
          }}
        />,
      );
      const anchor = screen.getByRole("link");
      expect(anchor).toHaveAttribute("target", "_blank");
      expect(anchor).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("video thumbnails", () => {
    it("overlays a play button when is_video is true and image is present", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://www.pinterest.com/pin/1",
            title: "Cool video",
            image: "https://i.pinimg.com/thumb.jpg",
            hostname: "pinterest.com",
            is_video: true,
          }}
        />,
      );
      // The overlay has aria-label="Video"; we can find it by that.
      expect(screen.getByLabelText("Video")).toBeInTheDocument();
    });

    it("does not render a play overlay when is_video is false", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://www.pinterest.com/pin/1",
            title: "Just an image",
            image: "https://i.pinimg.com/thumb.jpg",
            hostname: "pinterest.com",
            is_video: false,
          }}
        />,
      );
      expect(screen.queryByLabelText("Video")).not.toBeInTheDocument();
    });

    it("does not render a play overlay when there is no image, even if is_video is true", () => {
      render(
        <LinkCard
          linkCard={{
            url: "https://www.pinterest.com/pin/1",
            title: "Video pin with missing thumbnail",
            hostname: "pinterest.com",
            is_video: true,
          }}
        />,
      );
      expect(screen.queryByLabelText("Video")).not.toBeInTheDocument();
    });
  });
});
