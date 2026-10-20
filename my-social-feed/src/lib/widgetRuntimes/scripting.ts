// widgetRuntimes/scripting — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { wrapWithRuntime } from './helpers';

// ---------------------------------------------------------------------------
// Group 2: CDN-hosted interpreters
// ---------------------------------------------------------------------------

export function buildPython(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Python',
    'https://cdn.jsdelivr.net/pyodide/v0.27.5/full/pyodide.js',
    `async function main() {
  try {
    const pyodide = await loadPyodide();
    pyodide.setStdout({ batched: (msg) => print(msg) });
    pyodide.setStderr({ batched: (msg) => printErr(msg) });
    await pyodide.runPythonAsync(${escaped});
  } catch (e) { printErr('Error: ' + e.message); }
}
main();`, css);
}

export function buildRuby(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Ruby',
    'https://cdn.jsdelivr.net/npm/ruby-head-wasm-wasi@latest/dist/browser.script.iife.js',
    `(async () => {
  try {
    const rubyCode = ${escaped};
    // ruby-wasm script tag runtime — create a script element with type="text/ruby"
    const el = document.createElement('script');
    el.type = 'text/ruby';
    el.textContent = 'require "js"\\n' +
      'original_puts = method(:puts)\\n' +
      'define_method(:puts) do |*args|\\n' +
      '  args.each { |a| JS.global[:document].getElementById("output")[:textContent] += a.to_s + "\\\\n" }\\n' +
      'end\\n' + rubyCode;
    document.body.appendChild(el);
    // Fallback: if the runtime doesn't auto-execute, show code
    setTimeout(() => {
      if (!_out.textContent.trim()) print('Ruby runtime loading... Please wait.');
    }, 3000);
  } catch (e) { printErr('Error: ' + e.message); }
})();`, css);
}

export function buildPhp(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'PHP',
    'https://unpkg.com/php-wasm@8.2/php-web.js',
    `(async () => {
  try {
    const php = new PHP();
    await php.init();
    const result = await php.run(${escaped});
    print(result.stdout || '');
    if (result.stderr) printErr(result.stderr);
  } catch (e) { printErr('Error: ' + e.message); }
})();`, css);
}

export function buildSql(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'SQL',
    'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js',
    `async function main() {
  try {
    const SQL = await initSqlJs({ locateFile: f => 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/' + f });
    const db = new SQL.Database();
    const statements = ${escaped}.split(';').filter(s => s.trim());
    for (const stmt of statements) {
      try {
        const result = db.exec(stmt);
        if (result.length) {
          print(result[0].columns.join(' | '));
          print('-'.repeat(result[0].columns.join(' | ').length));
          result[0].values.forEach(row => print(row.join(' | ')));
        } else { print('OK'); }
      } catch (e) { printErr('SQL Error: ' + e.message); }
      print('');
    }
  } catch (e) { printErr('Error: ' + e.message); }
}
main();`, css);
}

export function buildLua(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Lua',
    'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js',
    `try {
  const luaCode = ${escaped};
  const el = document.createElement('script');
  el.type = 'application/lua';
  el.textContent = 'js = require "js"\\nlocal document = js.global.document\\nlocal out = document:getElementById("output")\\n' +
    'function print(...)\\n  local args = {...}\\n  local s = ""\\n  for i,v in ipairs(args) do s = s .. tostring(v) .. "\\\\t" end\\n' +
    '  out.textContent = out.textContent .. s .. "\\\\n"\\nend\\n' + luaCode;
  document.body.appendChild(el);
} catch (e) { printErr('Error: ' + e.message); }`, css);
}

export function buildCpp(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'C/C++',
    'https://cdn.jsdelivr.net/npm/JSCPP@2.0.2/dist/JSCPP.js',
    `try {
  const config = {
    stdio: {
      write: function(s) { print(s); }
    }
  };
  JSCPP.run(${escaped}, '', config);
} catch (e) { printErr('Error: ' + e.message); }`, css);
}

export function buildTypeScript(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'TypeScript', '',
    `const _tsScript = document.createElement('script');
_tsScript.src = 'https://cdn.jsdelivr.net/npm/typescript@5/lib/typescript.min.js';
_tsScript.onload = () => {
  try {
    const js = ts.transpile(${escaped}, { target: ts.ScriptTarget.ES2020 });
    const origLog = console.log;
    const origErr = console.error;
    console.log = (...args) => print(args.map(String).join(' '));
    console.error = (...args) => printErr(args.map(String).join(' '));
    (new Function(js))();
    console.log = origLog;
    console.error = origErr;
  } catch (e) { printErr('Error: ' + e.message); }
};
_tsScript.onerror = () => printErr('Failed to load TypeScript compiler');
document.head.appendChild(_tsScript);`, css);
}
