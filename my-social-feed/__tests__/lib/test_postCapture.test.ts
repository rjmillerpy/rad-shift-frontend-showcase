import {
  sanitizeFilename,
  extensionFromUrl,
  downloadMedia,
} from "@/lib/postCapture";

describe("sanitizeFilename", () => {
  test.each([
    ["hello world", "hello_world"],
    ["user@name!", "user_name_"],
    ["file.name.txt", "file.name.txt"],
    ["no-change_here.png", "no-change_here.png"],
    ["lots   of   spaces", "lots_of_spaces"],
    ["special#$%chars", "special_chars"],
    ["already_clean", "already_clean"],
  ])(
    "replaces special chars in '%s' producing '%s'",
    (input, expected) => {
      expect(sanitizeFilename(input)).toBe(expected);
    }
  );
});

describe("extensionFromUrl", () => {
  test.each([
    ["http://example.com/video.mp4", undefined, "mp4"],
    ["http://example.com/image.png?w=100", undefined, "png"],
    ["http://example.com/song.mp3", undefined, "mp3"],
    ["http://example.com/noext", undefined, "bin"],
    ["http://example.com/noext", "mp4", "mp4"],
    ["http://example.com/path/file.JPEG", undefined, "JPEG"],
  ] as const)(
    "extracts extension from '%s' with fallback '%s' returning '%s'",
    (url, fallback, expected) => {
      if (fallback === undefined) {
        expect(extensionFromUrl(url)).toBe(expected);
      } else {
        expect(extensionFromUrl(url, fallback)).toBe(expected);
      }
    }
  );
});

describe("downloadMedia", () => {
  it("creates an anchor element, appends it, clicks it, and removes it", () => {
    const clickSpy = jest.fn();
    const removeSpy = jest.fn();

    const origCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const anchor = origCreate("a");
        anchor.click = clickSpy;
        anchor.remove = removeSpy;
        return anchor;
      }
      return origCreate(tag);
    });

    const appendSpy = jest.spyOn(document.body, "appendChild");

    downloadMedia("http://example.com/video.mp4", "my_video.mp4");

    expect(appendSpy).toHaveBeenCalled();
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.tagName).toBe("A");
    expect(anchor.href).toContain("/api/download");
    expect(anchor.href).toContain(encodeURIComponent("http://example.com/video.mp4"));
    expect(anchor.download).toBe("my_video.mp4");
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();

    jest.restoreAllMocks();
  });

  it("sets download attribute to empty string when filename not provided", () => {
    const origCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      if (tag === "a") {
        const anchor = origCreate("a");
        anchor.click = jest.fn();
        anchor.remove = jest.fn();
        return anchor;
      }
      return origCreate(tag);
    });

    const appendSpy = jest.spyOn(document.body, "appendChild");

    downloadMedia("http://example.com/file");

    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe("");
    expect(anchor.href).not.toContain("&filename=");

    jest.restoreAllMocks();
  });
});
