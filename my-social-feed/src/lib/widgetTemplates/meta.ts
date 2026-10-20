// Category → emoji + description mappings used to label a rendered template.

export const CATEGORY_META: Record<string, { emoji: string; description: string }> = {
  game:             { emoji: "🎮", description: "Interactive game widget" },
  tool:             { emoji: "🛠", description: "Utility / productivity tool" },
  api_connector:    { emoji: "🌐", description: "Connect to external APIs" },
  display_modifier: { emoji: "🎨", description: "Transform and style content" },
  lambda:           { emoji: "⚡", description: "Serverless function handler" },
  visualization:    { emoji: "📊", description: "Data visualization widget" },
  social:           { emoji: "👥", description: "Social interaction component" },
  db_connector:     { emoji: "🗄", description: "Database query interface" },
};

// Language runtime descriptions — how each language is executed in-browser.
export const LANG_RUNTIME_DESC: Record<string, string> = {
  python: "Runs via Pyodide (CPython compiled to WebAssembly) in the browser",
  javascript: "Runs directly in the browser with full DOM access",
  typescript: "Transpiled and run in the browser with type checking",
  c: "Interpreted via JSCPP C interpreter in the browser",
  cpp: "Interpreted via JSCPP C++ interpreter in the browser",
  rust: "Compiled to WebAssembly and executed in the browser",
  golang: "Interpreted via a Go interpreter in the browser",
  sql: "Executed via sql.js (SQLite compiled to WebAssembly) in the browser",
  ruby: "Interpreted via Opal (Ruby-to-JS compiler) in the browser",
  basic: "Interpreted via a BASIC interpreter in the browser",
  react: "Rendered via React 18 with Babel transpilation in the browser",
  nodejs: "Runs in a sandboxed Node.js-like environment in the browser",
  php: "Interpreted via a PHP-to-JS transpiler in the browser",
};

export function langDesc(lang: string, category: string): string {
  const runtime = LANG_RUNTIME_DESC[lang] || `${lang} code rendered in the browser`;
  const meta = CATEGORY_META[category];
  return meta ? `${meta.description} — ${runtime}` : runtime;
}

// Comment helper for different language syntaxes — used by the template
// composition step (not the templates themselves) so a single "block of
// commentary" can be emitted in the right dialect for the target language.
export function commentBlock(lang: string, lines: string[]): string {
  switch (lang) {
    case "sql":
      return lines.map((l) => `-- ${l}`).join("\n");
    case "basic":
      return lines.map((l) => `REM ${l}`).join("\n");
    case "c":
    case "cpp":
    case "rust":
    case "golang":
    case "javascript":
    case "typescript":
    case "react":
    case "nodejs":
      return lines.map((l) => `// ${l}`).join("\n");
    case "php":
      return lines.map((l) => `// ${l}`).join("\n");
    default:
      return lines.map((l) => `# ${l}`).join("\n");
  }
}
