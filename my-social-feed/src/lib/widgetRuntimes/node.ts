// widgetRuntimes/node — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { wrapWithRuntime } from './helpers';
import { buildReact } from './frontend';

// ---------------------------------------------------------------------------
// Node.js / Next.js — server-side frameworks treated as JS with shims
// ---------------------------------------------------------------------------

export function buildNodejs(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Node.js', '',
    `// Node.js API shims
const process = { env: {}, argv: ['node', 'script.js'], exit: () => {}, version: 'v20.0.0', platform: 'browser' };
const require = (mod) => {
  const shims = {
    'path': { join: (...a) => a.join('/'), resolve: (...a) => a.join('/'), basename: (p) => p.split('/').pop() },
    'fs': { readFileSync: () => '(simulated)', writeFileSync: () => {}, existsSync: () => false },
    'os': { platform: () => 'browser', hostname: () => 'localhost', cpus: () => [{ model: 'simulated' }] },
    'util': { format: (...a) => a.map(String).join(' '), inspect: (o) => JSON.stringify(o, null, 2) },
  };
  if (shims[mod]) return shims[mod];
  throw new Error('Module "' + mod + '" is not available in browser simulation');
};
const module = { exports: {} };
const exports = module.exports;
const __dirname = '/simulated';
const __filename = '/simulated/script.js';

const origLog = console.log;
const origErr = console.error;
console.log = (...a) => print(a.map(String).join(' '));
console.error = (...a) => printErr(a.map(String).join(' '));
try {
  (new Function('require', 'module', 'exports', 'process', '__dirname', '__filename', 'console',
    ${escaped}))(require, module, exports, process, __dirname, __filename, console);
} catch(e) { printErr('Error: ' + e.message); }
console.log = origLog; console.error = origErr;`, css);
}

export function buildNextjs(code: string, css?: string): string {
  // Next.js is essentially React + Node; use the React runtime
  return buildReact(code, css);
}

// ---------------------------------------------------------------------------
// Simulated runtime for languages without stable WASM interpreters
// ---------------------------------------------------------------------------

export function buildSimulatedRuntime(code: string, language: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, language, '',
    `print('=== ${language} (simulated) ===');
print('');
try {
  const code = ${escaped};
  const lines = code.split('\\n');
  // Display the source code
  lines.forEach((line, i) => {
    print(String(i + 1).padStart(3) + ' | ' + line);
  });
  print('');
  print('--- Output ---');
  print('(${language} does not have a browser runtime. Showing source code above.)');
} catch(e) { printErr('Error: ' + e.message); }`, css);
}
