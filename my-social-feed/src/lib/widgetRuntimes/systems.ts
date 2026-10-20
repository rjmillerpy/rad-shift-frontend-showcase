// widgetRuntimes/systems — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { wrapWithRuntime } from './helpers';

// ---------------------------------------------------------------------------
// Golang — simulated interpreter
// ---------------------------------------------------------------------------

export function buildGolang(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Go', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n');
  const output = [];
  // Simple Go interpreter: handles fmt.Println, fmt.Printf, var, :=, for, if
  const vars = {};
  function evalGoExpr(expr) {
    expr = expr.trim();
    if (/^"(.*)"$/.test(expr)) return expr.slice(1, -1);
    if (/^\\d+\\.\\d+$/.test(expr)) return parseFloat(expr);
    if (/^\\d+$/.test(expr)) return parseInt(expr);
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (vars[expr] !== undefined) return vars[expr];
    // Simple binary ops
    const ops = ['+', '-', '*', '/'];
    for (const op of ops) {
      const idx = expr.lastIndexOf(op);
      if (idx > 0) {
        const l = evalGoExpr(expr.slice(0, idx));
        const r = evalGoExpr(expr.slice(idx + 1));
        if (op === '+') return typeof l === 'string' ? l + r : l + r;
        if (op === '-') return l - r;
        if (op === '*') return l * r;
        if (op === '/') return r !== 0 ? l / r : 0;
      }
    }
    return expr;
  }
  for (const line of lines) {
    const t = line.trim();
    // fmt.Println(...)
    let m = t.match(/^fmt\\.Println\\((.*)\\)$/);
    if (m) { output.push(m[1].split(',').map(a => String(evalGoExpr(a))).join(' ')); continue; }
    m = t.match(/^fmt\\.Printf\\("(.*)"(.*)\\)$/);
    if (m) { let s = m[1]; output.push(s.replace(/%[dvsfq]/g, () => String(evalGoExpr((m[2]||'').replace(/^,\\s*/, ''))))); continue; }
    // var x = val or x := val
    m = t.match(/^(?:var\\s+)?(\\w+)\\s*:?=\\s*(.+)$/);
    if (m && !t.startsWith('package') && !t.startsWith('import') && !t.startsWith('func')) {
      vars[m[1]] = evalGoExpr(m[2]);
    }
  }
  if (output.length) output.forEach(o => print(o));
  else { print('(No fmt.Print output detected)'); lines.forEach((l,i) => print(String(i+1).padStart(3) + ' | ' + l)); }
} catch(e) { printErr('Error: ' + e.message); }`, css);
}

// ---------------------------------------------------------------------------
// Rust — simulated interpreter
// ---------------------------------------------------------------------------

export function buildRust(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Rust', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n');
  const output = [];
  const vars = {};
  function evalRustExpr(expr) {
    expr = expr.trim();
    if (/^"(.*)"$/.test(expr)) return expr.slice(1, -1);
    if (/^\\d+\\.\\d+$/.test(expr)) return parseFloat(expr);
    if (/^\\d+$/.test(expr)) return parseInt(expr);
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (vars[expr] !== undefined) return vars[expr];
    return expr;
  }
  for (const line of lines) {
    const t = line.trim().replace(/;$/, '');
    // println!("...", args)
    let m = t.match(/^println!\\("(.*)"(.*)\\)$/);
    if (m) {
      let s = m[1];
      const args = m[2] ? m[2].replace(/^,\\s*/, '').split(',').map(a => evalRustExpr(a)) : [];
      let ai = 0;
      s = s.replace(/\\{\\}/g, () => ai < args.length ? String(args[ai++]) : '{}');
      output.push(s);
      continue;
    }
    // let (mut) x = val
    m = t.match(/^let\\s+(?:mut\\s+)?(\\w+)(?::\\s*\\w+)?\\s*=\\s*(.+)$/);
    if (m) { vars[m[1]] = evalRustExpr(m[2]); }
  }
  if (output.length) output.forEach(o => print(o));
  else { print('(No println! output detected)'); lines.forEach((l,i) => print(String(i+1).padStart(3) + ' | ' + l)); }
} catch(e) { printErr('Error: ' + e.message); }`, css);
}
