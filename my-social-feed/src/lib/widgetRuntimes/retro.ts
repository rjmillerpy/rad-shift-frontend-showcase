// widgetRuntimes/retro — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { wrapWithRuntime } from './helpers';

// ---------------------------------------------------------------------------
// FORTRAN — simulated interpreter
// ---------------------------------------------------------------------------

export function buildFortran(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Fortran', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n').map(l => l.trim()).filter(Boolean);
  const vars = {};
  const output = [];
  function evalFortExpr(expr) {
    expr = expr.trim();
    if (/^'(.*)'$/s.test(expr)) return expr.slice(1, -1);
    if (/^"(.*)"$/s.test(expr)) return expr.slice(1, -1);
    if (/^-?\\d+\\.?\\d*$/.test(expr)) return parseFloat(expr);
    if (vars[expr.toUpperCase()] !== undefined) return vars[expr.toUpperCase()];
    const m = expr.match(/^(.+?)\\s*([+\\-*/])\\s*(.+)$/);
    if (m) {
      const l = evalFortExpr(m[1]), r = evalFortExpr(m[3]);
      if (m[2] === '+') return l + r;
      if (m[2] === '-') return l - r;
      if (m[2] === '*') return l * r;
      if (m[2] === '/') return r !== 0 ? l / r : 0;
    }
    return expr;
  }
  let pc = 0, iterations = 0;
  const doStack = [];
  while (pc < lines.length && iterations < 10000) {
    iterations++;
    const line = lines[pc];
    const upper = line.toUpperCase();
    // WRITE(*,*) or PRINT *,
    let m = line.match(/^(?:WRITE\\s*\\(\\s*\\*\\s*,\\s*\\*\\s*\\)|PRINT\\s*\\*)\\s*(.+)/i);
    if (m) {
      const parts = m[1].split(',').map(p => String(evalFortExpr(p.trim())));
      output.push(parts.join(' '));
      pc++; continue;
    }
    // INTEGER/REAL declarations with assignment
    m = line.match(/^(?:INTEGER|REAL|CHARACTER).*::\\s*(\\w+)\\s*=\\s*(.+)/i);
    if (m) { vars[m[1].toUpperCase()] = evalFortExpr(m[2]); pc++; continue; }
    // Assignment: var = expr
    m = line.match(/^(\\w+)\\s*=\\s*(.+)$/);
    if (m && !upper.startsWith('IF') && !upper.startsWith('DO') && !upper.startsWith('PROGRAM') && !upper.startsWith('END')) {
      vars[m[1].toUpperCase()] = evalFortExpr(m[2]);
      pc++; continue;
    }
    // DO i = start, end
    m = line.match(/^DO\\s+(\\w+)\\s*=\\s*(\\S+)\\s*,\\s*(\\S+)(?:\\s*,\\s*(\\S+))?/i);
    if (m) {
      const v = m[1].toUpperCase();
      vars[v] = evalFortExpr(m[2]);
      doStack.push({ var: v, end: evalFortExpr(m[3]), step: m[4] ? evalFortExpr(m[4]) : 1, line: pc });
      pc++; continue;
    }
    // END DO
    if (/^END\\s*DO/i.test(upper)) {
      if (doStack.length) {
        const f = doStack[doStack.length - 1];
        vars[f.var] += f.step;
        if ((f.step > 0 && vars[f.var] <= f.end) || (f.step < 0 && vars[f.var] >= f.end)) {
          pc = f.line + 1; continue;
        } else { doStack.pop(); }
      }
      pc++; continue;
    }
    // IF (cond) THEN — skip for simplicity
    if (/^END\\s*PROGRAM/i.test(upper) || /^STOP/i.test(upper)) break;
    pc++;
  }
  output.forEach(o => print(o));
  if (!output.length) print('(No output)');
} catch(e) { printErr('Error: ' + e.message); }`, css);
}

// ---------------------------------------------------------------------------
// COBOL — simulated interpreter
// ---------------------------------------------------------------------------

export function buildCobol(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'COBOL', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n').map(l => l.trim()).filter(Boolean);
  const vars = {};
  const output = [];
  function evalCobolExpr(expr) {
    expr = expr.trim().replace(/\\.$/, '');
    if (/^"(.*)"$/s.test(expr)) return expr.slice(1, -1);
    if (/^'(.*)'$/s.test(expr)) return expr.slice(1, -1);
    if (/^-?\\d+\\.?\\d*$/.test(expr)) return parseFloat(expr);
    if (vars[expr.toUpperCase()] !== undefined) return vars[expr.toUpperCase()];
    return expr;
  }
  for (const line of lines) {
    const t = line.replace(/\\.$/, '').trim();
    const upper = t.toUpperCase();
    // DISPLAY
    let m = t.match(/^DISPLAY\\s+(.*)/i);
    if (m) {
      const parts = m[1].split(/\\s+/).map(p => String(evalCobolExpr(p)));
      output.push(parts.join(' '));
      continue;
    }
    // MOVE val TO var
    m = t.match(/^MOVE\\s+(.+?)\\s+TO\\s+(\\w[\\w-]*)/i);
    if (m) { vars[m[2].toUpperCase()] = evalCobolExpr(m[1]); continue; }
    // COMPUTE var = expr
    m = t.match(/^COMPUTE\\s+(\\w[\\w-]*)\\s*=\\s*(.+)/i);
    if (m) {
      try {
        const expr = m[2].replace(/[A-Z][A-Z0-9-]*/gi, v => {
          const val = vars[v.toUpperCase()];
          return val !== undefined ? String(val) : '0';
        });
        vars[m[1].toUpperCase()] = eval(expr);
      } catch(e2) { vars[m[1].toUpperCase()] = 0; }
      continue;
    }
    // ADD x TO y
    m = t.match(/^ADD\\s+(\\S+)\\s+TO\\s+(\\w[\\w-]*)/i);
    if (m) {
      vars[m[2].toUpperCase()] = (vars[m[2].toUpperCase()] || 0) + evalCobolExpr(m[1]);
      continue;
    }
    // SUBTRACT x FROM y
    m = t.match(/^SUBTRACT\\s+(\\S+)\\s+FROM\\s+(\\w[\\w-]*)/i);
    if (m) {
      vars[m[2].toUpperCase()] = (vars[m[2].toUpperCase()] || 0) - evalCobolExpr(m[1]);
      continue;
    }
    // STOP RUN
    if (/^STOP\\s+RUN/i.test(upper)) break;
  }
  output.forEach(o => print(o));
  if (!output.length) print('(No output)');
} catch(e) { printErr('Error: ' + e.message); }`, css);
}

// ---------------------------------------------------------------------------
// Assembly — simulated x86-style interpreter
// ---------------------------------------------------------------------------

export function buildAssembly(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Assembly', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n').map(l => l.trim()).filter(l => l && !l.startsWith(';'));
  const regs = { eax:0, ebx:0, ecx:0, edx:0, esi:0, edi:0, esp:1024, ebp:0 };
  const flags = { zf: false, sf: false, cf: false };
  const stack = [];
  const output = [];
  const labels = {};
  const data = {};
  // First pass: find labels and data
  lines.forEach((l, i) => {
    const m = l.match(/^(\\w+):/);
    if (m) labels[m[1].toLowerCase()] = i;
    const dm = l.match(/^(\\w+)\\s+db\\s+"(.*)"\\s*,?\\s*(?:0xa|10)?/i);
    if (dm) data[dm[1].toLowerCase()] = dm[2];
  });
  function resolveOp(op) {
    op = op.trim().toLowerCase();
    if (regs[op] !== undefined) return regs[op];
    if (data[op] !== undefined) return data[op];
    if (/^-?\\d+$/.test(op)) return parseInt(op);
    if (/^0x[0-9a-f]+$/i.test(op)) return parseInt(op, 16);
    if (/^'(.)'$/.test(op)) return op.charCodeAt(1);
    return 0;
  }
  function setOp(dst, val) { dst = dst.trim().toLowerCase(); if (regs[dst] !== undefined) regs[dst] = val; }
  let pc = 0, iterations = 0;
  while (pc < lines.length && iterations < 10000) {
    iterations++;
    let line = lines[pc].replace(/;.*$/, '').trim();
    if (!line || line.endsWith(':')) { pc++; continue; }
    // Remove label prefix
    line = line.replace(/^\\w+:\\s*/, '');
    if (!line) { pc++; continue; }
    const parts = line.split(/[\\s,]+/);
    const inst = parts[0].toLowerCase();
    const a1 = parts[1] || '', a2 = parts.slice(2).join(' ') || '';
    if (inst === 'mov') { setOp(a1, resolveOp(a2)); }
    else if (inst === 'add') { const r = resolveOp(a1) + resolveOp(a2); setOp(a1, r); flags.zf = r === 0; flags.sf = r < 0; }
    else if (inst === 'sub') { const r = resolveOp(a1) - resolveOp(a2); setOp(a1, r); flags.zf = r === 0; flags.sf = r < 0; }
    else if (inst === 'mul') { regs.eax = regs.eax * resolveOp(a1); }
    else if (inst === 'div') { const d = resolveOp(a1); if (d) { regs.edx = regs.eax % d; regs.eax = Math.floor(regs.eax / d); } }
    else if (inst === 'inc') { setOp(a1, resolveOp(a1) + 1); }
    else if (inst === 'dec') { const r = resolveOp(a1) - 1; setOp(a1, r); flags.zf = r === 0; }
    else if (inst === 'push') { stack.push(resolveOp(a1)); }
    else if (inst === 'pop') { setOp(a1, stack.pop() || 0); }
    else if (inst === 'cmp') { const r = resolveOp(a1) - resolveOp(a2); flags.zf = r === 0; flags.sf = r < 0; }
    else if (inst === 'jmp') { const t = labels[a1.toLowerCase()]; if (t !== undefined) { pc = t; continue; } }
    else if (inst === 'je' || inst === 'jz') { if (flags.zf) { const t = labels[a1.toLowerCase()]; if (t !== undefined) { pc = t; continue; } } }
    else if (inst === 'jne' || inst === 'jnz') { if (!flags.zf) { const t = labels[a1.toLowerCase()]; if (t !== undefined) { pc = t; continue; } } }
    else if (inst === 'jl') { if (flags.sf) { const t = labels[a1.toLowerCase()]; if (t !== undefined) { pc = t; continue; } } }
    else if (inst === 'jg') { if (!flags.sf && !flags.zf) { const t = labels[a1.toLowerCase()]; if (t !== undefined) { pc = t; continue; } } }
    else if (inst === 'int') {
      // Linux syscall simulation: int 0x80
      if (regs.eax === 4) { // sys_write
        const msg = data[Object.keys(data)[0]] || String.fromCharCode(regs.ecx);
        output.push(msg);
      } else if (regs.eax === 1) { break; } // sys_exit
    }
    else if (inst === 'call') { /* skip */ }
    else if (inst === 'ret' || inst === 'hlt') { break; }
    else if (inst === 'xor') { const r = resolveOp(a1) ^ resolveOp(a2); setOp(a1, r); flags.zf = r === 0; }
    else if (inst === 'and') { const r = resolveOp(a1) & resolveOp(a2); setOp(a1, r); flags.zf = r === 0; }
    else if (inst === 'or') { const r = resolveOp(a1) | resolveOp(a2); setOp(a1, r); flags.zf = r === 0; }
    else if (inst === 'nop' || inst === 'section' || inst === 'global' || inst === 'extern') { /* skip */ }
    pc++;
  }
  if (output.length) { output.forEach(o => print(o)); }
  else {
    print('=== Registers ===');
    Object.entries(regs).forEach(([r, v]) => print('  ' + r.toUpperCase() + ' = ' + v));
  }
} catch(e) { printErr('Error: ' + e.message); }`, css);
}

// ---------------------------------------------------------------------------
// Visual Basic — simulated interpreter
// ---------------------------------------------------------------------------

export function buildVisualBasic(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  return wrapWithRuntime(code, 'Visual Basic', '',
    `try {
  const code = ${escaped};
  const lines = code.split('\\n').map(l => l.trim()).filter(Boolean);
  const vars = {};
  const output = [];
  const subs = {};
  function evalVbExpr(expr) {
    expr = expr.trim();
    if (/^"(.*)"$/s.test(expr)) return expr.slice(1, -1);
    if (/^-?\\d+\\.?\\d*$/.test(expr)) return parseFloat(expr);
    if (expr.toLowerCase() === 'true') return true;
    if (expr.toLowerCase() === 'false') return false;
    if (vars[expr.toLowerCase()] !== undefined) return vars[expr.toLowerCase()];
    // Concatenation with &
    if (expr.includes('&')) {
      return expr.split('&').map(p => String(evalVbExpr(p))).join('');
    }
    // Binary ops
    const m = expr.match(/^(.+?)\\s*([+\\-*/])\\s*(.+)$/);
    if (m) {
      const l = evalVbExpr(m[1]), r = evalVbExpr(m[3]);
      if (m[2] === '+') return typeof l === 'string' ? l + r : l + r;
      if (m[2] === '-') return l - r;
      if (m[2] === '*') return l * r;
      if (m[2] === '/') return r !== 0 ? l / r : 0;
    }
    return expr;
  }
  // First pass: find Subs and Functions
  let inSub = null;
  let subLines = [];
  const mainLines = [];
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (/^(?:SUB|FUNCTION)\\s+(\\w+)/i.test(line)) {
      inSub = line.match(/^(?:SUB|FUNCTION)\\s+(\\w+)/i)[1].toLowerCase();
      subLines = [];
      continue;
    }
    if (/^END\\s+(?:SUB|FUNCTION)/i.test(upper)) {
      if (inSub) subs[inSub] = subLines;
      inSub = null;
      continue;
    }
    if (inSub) { subLines.push(line); continue; }
    mainLines.push(line);
  }
  function execLines(lns) {
    for (const line of lns) {
      const t = line.trim();
      const upper = t.toUpperCase();
      // MsgBox
      let m = t.match(/^MsgBox\\s+(.*)/i);
      if (m) { output.push(String(evalVbExpr(m[1]))); continue; }
      // Console.WriteLine
      m = t.match(/^Console\\.WriteLine\\((.*)\\)$/i);
      if (m) { output.push(String(evalVbExpr(m[1]))); continue; }
      // Debug.Print
      m = t.match(/^Debug\\.Print\\s+(.*)/i);
      if (m) { output.push(String(evalVbExpr(m[1]))); continue; }
      // Dim var As Type = val
      m = t.match(/^Dim\\s+(\\w+)(?:\\s+As\\s+\\w+)?(?:\\s*=\\s*(.+))?$/i);
      if (m) { vars[m[1].toLowerCase()] = m[2] ? evalVbExpr(m[2]) : 0; continue; }
      // var = expr
      m = t.match(/^(\\w+)\\s*=\\s*(.+)$/);
      if (m && !upper.startsWith('IF') && !upper.startsWith('FOR') && !upper.startsWith('DIM')) {
        vars[m[1].toLowerCase()] = evalVbExpr(m[2]);
        continue;
      }
      // Call sub
      m = t.match(/^(?:Call\\s+)?(\\w+)(?:\\(.*\\))?$/i);
      if (m && subs[m[1].toLowerCase()]) {
        execLines(subs[m[1].toLowerCase()]);
        continue;
      }
    }
  }
  execLines(mainLines);
  output.forEach(o => print(o));
  if (!output.length) print('(No output)');
} catch(e) { printErr('Error: ' + e.message); }`, css);
}
