import { wrapCodeForBrowser } from "@/lib/widgetRuntimes";
import * as runtimes from "@/lib/widgetRuntimes";
import { buildBasic } from "@/lib/widgetRuntimes/basic";
import { buildCsharp } from "@/lib/widgetRuntimes/csharp";
import { buildAngular, buildReact, buildSvelte, buildVue } from "@/lib/widgetRuntimes/frontend";
import { buildNextjs, buildNodejs, buildSimulatedRuntime } from "@/lib/widgetRuntimes/node";
import { buildAssembly, buildCobol, buildFortran, buildVisualBasic } from "@/lib/widgetRuntimes/retro";
import {
  buildCpp, buildLua, buildPhp, buildPython, buildRuby, buildSql, buildTypeScript,
} from "@/lib/widgetRuntimes/scripting";
import { buildGolang, buildRust } from "@/lib/widgetRuntimes/systems";
import { buildCss, buildHtml, buildJavaScript } from "@/lib/widgetRuntimes/web";

type Builder = (code: string, css?: string) => string;

const CODE = "line one\nprint('two') // \"quoted\"";
const CSS = ".mine { color: red; }";

// One row per language id the widget editor can send, with the builder that must handle it.
const DISPATCH: [string, Builder][] = [
  ["html", buildHtml],
  ["javascript", buildJavaScript],
  ["css", buildCss],
  ["typescript", buildTypeScript],
  ["python", buildPython],
  ["ruby", buildRuby],
  ["php", buildPhp],
  ["sql", buildSql],
  ["lua", buildLua],
  ["c", buildCpp],
  ["cpp", buildCpp],
  ["csharp", buildCsharp],
  ["golang", buildGolang],
  ["rust", buildRust],
  ["react", buildReact],
  ["vue", buildVue],
  ["angular", buildAngular],
  ["svelte", buildSvelte],
  ["nodejs", buildNodejs],
  ["nextjs", buildNextjs],
  ["basic", buildBasic],
  ["fortran", buildFortran],
  ["cobol", buildCobol],
  ["assembly", buildAssembly],
  ["visual_basic", buildVisualBasic],
];

describe("widgetRuntimes index", () => {
  it("exposes wrapCodeForBrowser as its only public export", () => {
    expect(Object.keys(runtimes)).toEqual(["wrapCodeForBrowser"]);
  });
});

describe("wrapCodeForBrowser", () => {
  it.each(DISPATCH)("routes %s to its dedicated builder, passing code and css through", (language, build) => {
    expect(wrapCodeForBrowser(CODE, language, CSS)).toBe(build(CODE, CSS));
    expect(wrapCodeForBrowser(CODE, language)).toBe(build(CODE));
  });

  it.each(DISPATCH.filter(([language]) => !["angular", "svelte"].includes(language)))(
    "%s does not fall through to the generic source-listing runtime",
    (language) => {
      expect(wrapCodeForBrowser(CODE, language)).not.toContain("does not have a browser runtime");
    },
  );

  it.each([
    ["upper case", "PYTHON", "python"],
    ["mixed case", "JavaScript", "javascript"],
    ["mixed case with underscore", "Visual_Basic", "visual_basic"],
  ])("matches the language id case-insensitively (%s)", (_label, given, canonical) => {
    expect(wrapCodeForBrowser(CODE, given, CSS)).toBe(wrapCodeForBrowser(CODE, canonical, CSS));
  });

  it.each([
    ["an unknown language", "klingon"],
    ["an empty language", ""],
    ["an id with surrounding whitespace", " python "],
    ["a real language without a runtime", "haskell"],
  ])("falls back to the simulated runtime, labelled with the given name, for %s", (_label, language) => {
    expect(wrapCodeForBrowser(CODE, language, CSS)).toBe(buildSimulatedRuntime(CODE, language, CSS));
  });

  it("gives every language (bar the c/cpp and nextjs/react aliases) its own distinct document", () => {
    const distinct = DISPATCH.filter(([language]) => !["c", "nextjs"].includes(language));
    const documents = new Set(distinct.map(([language]) => wrapCodeForBrowser(CODE, language)));
    expect(documents.size).toBe(distinct.length);
  });
});
