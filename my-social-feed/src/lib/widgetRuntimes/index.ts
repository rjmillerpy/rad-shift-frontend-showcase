// Public entry point for the widget runtime dispatcher. Consumers still
// import from `@/lib/widgetRuntimes` — the split is transparent.

import { buildCss, buildHtml, buildJavaScript } from "./web";
import {
  buildCpp, buildLua, buildPhp, buildPython, buildRuby, buildSql, buildTypeScript,
} from "./scripting";
import { buildAngular, buildReact, buildSvelte, buildVue } from "./frontend";
import { buildNextjs, buildNodejs, buildSimulatedRuntime } from "./node";
import { buildGolang, buildRust } from "./systems";
import { buildCsharp } from "./csharp";
import { buildBasic } from "./basic";
import { buildAssembly, buildCobol, buildFortran, buildVisualBasic } from "./retro";

type RuntimeBuilder = (code: string, css?: string) => string;

const RUNTIME_MAP: Record<string, RuntimeBuilder> = {
  html: buildHtml,
  javascript: buildJavaScript,
  css: buildCss,
  typescript: buildTypeScript,
  python: buildPython,
  ruby: buildRuby,
  php: buildPhp,
  sql: buildSql,
  lua: buildLua,
  c: buildCpp,
  cpp: buildCpp,
  csharp: buildCsharp,
  golang: buildGolang,
  rust: buildRust,
  react: buildReact,
  vue: buildVue,
  angular: buildAngular,
  svelte: buildSvelte,
  nodejs: buildNodejs,
  nextjs: buildNextjs,
  basic: buildBasic,
  fortran: buildFortran,
  cobol: buildCobol,
  assembly: buildAssembly,
  visual_basic: buildVisualBasic,
};

/**
 * Wrap user code in a complete HTML document that runs it in the browser
 * using the appropriate interpreter. The returned HTML is suitable for use
 * as `srcdoc` in a sandboxed iframe.
 */
export function wrapCodeForBrowser(code: string, language: string, css?: string): string {
  const builder = RUNTIME_MAP[language.toLowerCase()];
  if (builder) return builder(code, css);
  return buildSimulatedRuntime(code, language, css);
}
