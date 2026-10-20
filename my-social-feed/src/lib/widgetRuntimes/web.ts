// widgetRuntimes/web — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.


// ---------------------------------------------------------------------------
// Group 1: Native browser languages
// ---------------------------------------------------------------------------

export function buildHtml(code: string, css?: string): string {
  if (!css) return code;
  if (code.includes('</head>')) {
    return code.replace('</head>', `<style>${css}</style></head>`);
  }
  return `<style>${css}</style>${code}`;
}

export function buildJavaScript(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', monospace; background: #1e1e1e; color: #d4d4d4; }
#output { padding: 12px; white-space: pre-wrap; font-size: 13px; min-height: 100vh; overflow: auto; }
.error { color: #f44747; }
${css || ''}
</style>
</head><body>
<div id="output"></div>
<script>
const _out = document.getElementById('output');
function print(msg) { _out.textContent += msg + '\\n'; }
function printErr(msg) { _out.innerHTML += '<span class="error">' + msg + '<\/span>\\n'; }
const _origLog = console.log;
const _origErr = console.error;
const _origWarn = console.warn;
console.log = (...a) => print(a.map(String).join(' '));
console.error = (...a) => printErr(a.map(String).join(' '));
console.warn = (...a) => print('WARN: ' + a.map(String).join(' '));
try {
  (new Function(${escaped}))();
} catch(e) { printErr('Error: ' + e.message); }
console.log = _origLog; console.error = _origErr; console.warn = _origWarn;
<\/script>
</body></html>`;
}

export function buildCss(code: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<style>${code}</style>
</head><body>
<div class="demo">
  <h1>CSS Preview</h1>
  <p>This is a paragraph demonstrating your styles.</p>
  <button>A Button</button>
  <div class="box" style="width:100px;height:100px;margin:10px;border:1px solid #ccc"></div>
  <ul><li>Item One</li><li>Item Two</li><li>Item Three</li></ul>
  <input type="text" placeholder="Text input" />
</div>
</body></html>`;
}
