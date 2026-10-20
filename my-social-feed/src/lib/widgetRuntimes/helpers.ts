// widgetRuntimes/helpers — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

/**
 * Language runtime system — wraps user code in HTML with the appropriate
 * browser-based interpreter so it can run inside a sandboxed iframe.
 */

// ---------------------------------------------------------------------------
// Shared HTML template
// ---------------------------------------------------------------------------

export function wrapWithRuntime(
  code: string, language: string, interpreterUrl: string,
  runnerCode: string, css?: string,
): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', monospace; background: #1e1e1e; color: #d4d4d4; }
#output { padding: 12px; white-space: pre-wrap; font-size: 13px; min-height: 100vh; overflow: auto; }
.error { color: #f44747; }
.info { color: #569cd6; }
${css || ''}
</style>
</head><body>
<div id="output"><span class="info">Loading ${language} runtime...</span>\n</div>
${interpreterUrl ? `<script src="${interpreterUrl}"><\/script>` : ''}
<script>
const _out = document.getElementById('output');
function print(msg) { _out.textContent += msg + '\\n'; }
function printErr(msg) { _out.innerHTML += '<span class="error">' + msg + '<\/span>\\n'; }
_out.textContent = '';
${runnerCode}
<\/script>
</body></html>`;
}

export function wrapWithMultiScript(
  code: string, language: string, scripts: string[],
  runnerCode: string, css?: string,
): string {
  const scriptTags = scripts.map(s => `<script src="${s}"><\/script>`).join('\n');
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Courier New', monospace; background: #1e1e1e; color: #d4d4d4; }
#output { padding: 12px; white-space: pre-wrap; font-size: 13px; min-height: 100vh; overflow: auto; }
.error { color: #f44747; }
.info { color: #569cd6; }
${css || ''}
</style>
</head><body>
<div id="output"><span class="info">Loading ${language} runtime...</span>\n</div>
${scriptTags}
<script>
const _out = document.getElementById('output');
function print(msg) { _out.textContent += msg + '\\n'; }
function printErr(msg) { _out.innerHTML += '<span class="error">' + msg + '<\/span>\\n'; }
_out.textContent = '';
${runnerCode}
<\/script>
</body></html>`;
}
