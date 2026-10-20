// widgetRuntimes/csharp — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { wrapWithRuntime } from './helpers';

// ---------------------------------------------------------------------------
// C# — simulated interpreter
// ---------------------------------------------------------------------------

export function buildCsharp(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'C#', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n');
  const output = [];
  const vars = {};
  function evalCsExpr(expr) {
    expr = expr.trim();
    if (/^"(.*)"$/.test(expr)) return expr.slice(1, -1);
    if (/^\\d+$/.test(expr)) return parseInt(expr);
    if (/^\\d+\\.\\d+f?$/.test(expr)) return parseFloat(expr);
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (vars[expr] !== undefined) return vars[expr];
    // string interpolation \\$"..."
    if (/^\\$"(.*)"$/.test(expr)) {
      return expr.slice(2, -1).replace(/\\{(\\w+)\\}/g, (_, v) => vars[v] !== undefined ? String(vars[v]) : '{' + v + '}');
    }
    // Binary ops
    const ops = ['+', '-', '*', '/'];
    for (const op of ops) {
      const idx = expr.lastIndexOf(op);
      if (idx > 0) {
        const l = evalCsExpr(expr.slice(0, idx));
        const r = evalCsExpr(expr.slice(idx + 1));
        if (op === '+') return typeof l === 'string' ? l + r : l + r;
        if (op === '-') return l - r;
        if (op === '*') return l * r;
        if (op === '/') return r !== 0 ? l / r : 0;
      }
    }
    return expr;
  }
  for (const line of lines) {
    const t = line.trim().replace(/;$/, '');
    // Console.WriteLine(...)
    let m = t.match(/^Console\\.WriteLine\\((.*)\\)$/);
    if (m) { output.push(String(evalCsExpr(m[1]))); continue; }
    m = t.match(/^Console\\.Write\\((.*)\\)$/);
    if (m) { output.push(String(evalCsExpr(m[1]))); continue; }
    // var x = val or int x = val
    m = t.match(/^(?:var|int|string|float|double|bool|char)\\s+(\\w+)\\s*=\\s*(.+)$/);
    if (m) { vars[m[1]] = evalCsExpr(m[2]); }
  }
  if (output.length) output.forEach(o => print(o));
  else { print('(No Console.WriteLine output detected)'); lines.forEach((l,i) => print(String(i+1).padStart(3) + ' | ' + l)); }
} catch(e) { printErr('Error: ' + e.message); }`, css);
}
