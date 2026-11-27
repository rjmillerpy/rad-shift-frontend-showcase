import { SDK_TAG, withSdk } from "@/app/widgets/storage/sdk";

describe("withSdk", () => {
  it("puts the SDK first inside <head>", () => {
    expect(withSdk("<html><head><title>t</title></head></html>")).toBe(
      `<html><head>${SDK_TAG}<title>t</title></head></html>`,
    );
  });

  it("puts it at the start when there is no <head>", () => {
    expect(withSdk("<div>hi</div>")).toBe(`${SDK_TAG}<div>hi</div>`);
  });

  it("loads it from the API", () => {
    expect(SDK_TAG).toMatch(/src=".*\/widgets\/sdk\.js"/);
  });
});
