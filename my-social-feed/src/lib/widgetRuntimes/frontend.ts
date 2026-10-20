// widgetRuntimes/frontend — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { buildSimulatedRuntime } from './node';

// ---------------------------------------------------------------------------
// Framework runtimes (React, Vue, Angular, Svelte)
// ---------------------------------------------------------------------------

export function buildReact(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
.error { color: #f44747; font-family: monospace; padding: 12px; }
${css || ''}
</style>
</head><body>
<div id="root"></div>
<div id="output" style="display:none"></div>
<script src="https://unpkg.com/react@18/umd/react.development.js"><\/script>
<script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\/script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"><\/script>
<script>
try {
  const code = ${escaped};
  const transformed = Babel.transform(code, { presets: ['react'] }).code;
  const origLog = console.log;
  console.log = (...a) => {
    const o = document.getElementById('output');
    if (o) o.textContent += a.map(String).join(' ') + '\\n';
  };
  const module = { exports: {} };
  const exports = module.exports;
  (new Function('React', 'ReactDOM', 'module', 'exports', transformed))(React, ReactDOM, module, exports);
  // Try to render the default export or module.exports
  const Component = module.exports.default || module.exports;
  if (typeof Component === 'function') {
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(Component));
  }
  console.log = origLog;
} catch(e) {
  document.getElementById('root').innerHTML = '<div class="error">Error: ' + e.message + '<\/div>';
}
<\/script>
</body></html>`;
}

export function buildVue(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
.error { color: #f44747; font-family: monospace; padding: 12px; }
${css || ''}
</style>
</head><body>
<div id="app"></div>
<script src="https://unpkg.com/vue@3/dist/vue.global.js"><\/script>
<script>
try {
  const code = ${escaped};
  // Simple: wrap code in a component setup
  const origLog = console.log;
  console.log = (...a) => origLog(...a);
  const fn = new Function('Vue', code);
  fn(Vue);
  // If #app has no content, create a basic app
  if (!document.getElementById('app').innerHTML.trim()) {
    const app = Vue.createApp({ template: '<div>Vue app loaded. Check your component setup.</div>' });
    app.mount('#app');
  }
  console.log = origLog;
} catch(e) {
  document.getElementById('app').innerHTML = '<div class="error">Error: ' + e.message + '<\/div>';
}
<\/script>
</body></html>`;
}

export function buildAngular(code: string, css?: string): string {
  // Angular doesn't have a simple CDN drop-in; show code + simulated output
  return buildSimulatedRuntime(code, 'Angular', css);
}

export function buildSvelte(code: string, css?: string): string {
  // Svelte requires compilation; show code + simulated output
  return buildSimulatedRuntime(code, 'Svelte', css);
}
