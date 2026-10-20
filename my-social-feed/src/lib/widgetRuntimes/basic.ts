// widgetRuntimes/basic — split from widgetRuntimes.ts. Each file
// groups related language runtimes so touching one doesn't force a
// full-file rebuild.

import { wrapWithRuntime } from './helpers';

// ---------------------------------------------------------------------------
// BASIC — simulated interpreter
// ---------------------------------------------------------------------------

export function buildBasic(code: string, css?: string): string {
  const escaped = JSON.stringify(code);
  // Event-driven BASIC interpreter that pauses at INPUT and waits for user interaction
  const runtimeJs = `
try {
  const code = ${escaped};
  const lines = code.split('\\n').map(l => l.trim()).filter(Boolean);
  const vars = {};
  const forStack = [];

  function evalExpr(expr) {
    expr = expr.trim();
    if (/^"(.*)"$/s.test(expr)) return expr.slice(1, -1);
    if (/^-?\\d+\\.?\\d*$/.test(expr)) return parseFloat(expr);
    if (vars[expr.toUpperCase()] !== undefined) return vars[expr.toUpperCase()];
    const m = expr.match(/^(.+?)\\s*([+\\-*\\/])\\s*(.+)$/);
    if (m) {
      const l = evalExpr(m[1]), r = evalExpr(m[3]);
      if (m[2] === '+') return typeof l === 'string' ? l + String(r) : l + r;
      if (m[2] === '-') return l - r;
      if (m[2] === '*') return l * r;
      if (m[2] === '/') return r !== 0 ? l / r : 0;
    }
    return expr;
  }

  function printParts(raw) {
    const parts = []; let buf = '', inS = false;
    for (let i = 0; i < raw.length; i++) {
      const c = raw[i];
      if (c === '"') { inS = !inS; buf += c; }
      else if (c === ';' && !inS) { parts.push(buf.trim()); buf = ''; }
      else buf += c;
    }
    if (buf.trim()) parts.push(buf.trim());
    return parts.map(p => String(evalExpr(p))).join('');
  }

  const parsed = lines.map(l => {
    const m = l.match(/^(\\d+)\\s+(.*)$/);
    return m ? { num: parseInt(m[1]), text: m[2] } : { num: 0, text: l };
  });

  const out = document.getElementById('output');
  let pc = 0, iter = 0;

  // Input UI elements
  const inputDiv = document.createElement('div');
  inputDiv.id = 'basic-input';
  inputDiv.style.cssText = 'padding:8px 12px;display:none;';
  const inputLabel = document.createElement('span');
  inputLabel.style.color = '#9cdcfe';
  const inputField = document.createElement('input');
  inputField.type = 'text';
  inputField.style.cssText = 'background:#252526;color:#d4d4d4;border:1px solid #569cd6;border-radius:4px;padding:6px 10px;font-family:monospace;font-size:14px;margin:0 8px;width:120px;outline:none;';
  const inputBtn = document.createElement('button');
  inputBtn.textContent = 'Enter';
  inputBtn.style.cssText = 'background:#0e639c;color:#fff;border:none;border-radius:4px;padding:6px 14px;cursor:pointer;font-size:13px;';
  inputDiv.appendChild(inputLabel);
  inputDiv.appendChild(inputField);
  inputDiv.appendChild(inputBtn);
  out.parentNode.appendChild(inputDiv);

  let waitingForInput = null; // { varName, prompt }

  function resumeAfterInput(value) {
    if (!waitingForInput) return;
    const v = waitingForInput.varName;
    const num = parseFloat(value);
    vars[v] = isNaN(num) ? value : num;
    waitingForInput = null;
    inputDiv.style.display = 'none';
    pc++;
    runLoop();
  }

  inputBtn.onclick = () => resumeAfterInput(inputField.value);
  inputField.onkeydown = (e) => { if (e.key === 'Enter') resumeAfterInput(inputField.value); };

  function runLoop() {
    while (pc < parsed.length && iter < 10000) {
      iter++;
      const { text } = parsed[pc];
      const upper = text.toUpperCase();
      let m;

      // REM
      if (upper.startsWith('REM')) { pc++; continue; }

      // PRINT
      m = text.match(/^PRINT\\s+(.*)/i);
      if (m) { print(printParts(m[1])); pc++; continue; }

      // INPUT "prompt", VAR  or  INPUT VAR
      m = text.match(/^INPUT\\s+"([^"]*)"\\s*[,;]\\s*(\\w+)/i) || text.match(/^INPUT\\s+(\\w+)/i);
      if (m) {
        const varName = (m[2] || m[1]).toUpperCase();
        const prompt = m[2] ? m[1] : varName + '?';
        waitingForInput = { varName };
        inputLabel.textContent = prompt + ' ';
        inputField.value = '';
        inputDiv.style.display = 'block';
        inputField.focus();
        return; // Pause execution — resume on input
      }

      // LET var = expr
      m = text.match(/^(?:LET\\s+)?(\\w+)\\s*=\\s*(.+)/i);
      if (m && !upper.startsWith('IF') && !upper.startsWith('FOR') && !upper.startsWith('GOTO')) {
        vars[m[1].toUpperCase()] = evalExpr(m[2]);
        pc++; continue;
      }

      // FOR var = start TO end (STEP step)
      m = text.match(/^FOR\\s+(\\w+)\\s*=\\s*(\\S+)\\s+TO\\s+(\\S+)(?:\\s+STEP\\s+(\\S+))?/i);
      if (m) {
        const v = m[1].toUpperCase();
        vars[v] = evalExpr(m[2]);
        forStack.push({ v, end: evalExpr(m[3]), step: m[4] ? evalExpr(m[4]) : 1, line: pc });
        pc++; continue;
      }

      // NEXT
      if (upper.startsWith('NEXT')) {
        if (forStack.length) {
          const f = forStack[forStack.length - 1];
          vars[f.v] += f.step;
          if ((f.step > 0 && vars[f.v] <= f.end) || (f.step < 0 && vars[f.v] >= f.end)) {
            pc = f.line + 1; continue;
          } else { forStack.pop(); }
        }
        pc++; continue;
      }

      // IF cond THEN action
      m = text.match(/^IF\\s+(.+?)\\s+THEN\\s+(.+)/i);
      if (m) {
        const cond = m[1].replace(/<>/g, '!=').replace(/([^<>=!])=([^=])/g, '$1==$2');
        try {
          const keys = Object.keys(vars), vals = Object.values(vars);
          const condFn = new Function(...keys, 'return (' + cond + ')');
          if (condFn(...vals)) {
            const thenLine = m[2].trim();
            const gm = thenLine.match(/^GOTO\\s+(\\d+)/i);
            if (gm) {
              const idx = parsed.findIndex(p => p.num === parseInt(gm[1]));
              if (idx >= 0) { pc = idx; continue; }
            }
            if (/^PRINT/i.test(thenLine)) {
              print(printParts(thenLine.replace(/^PRINT\\s+/i, '')));
            }
            const lm = thenLine.match(/^(?:LET\\s+)?(\\w+)\\s*=\\s*(.+)/i);
            if (lm && !/^GOTO|^PRINT/i.test(thenLine)) {
              vars[lm[1].toUpperCase()] = evalExpr(lm[2]);
            }
          }
        } catch(e) { printErr('IF error: ' + e.message); }
        pc++; continue;
      }

      // GOTO
      m = text.match(/^GOTO\\s+(\\d+)/i);
      if (m) {
        const idx = parsed.findIndex(p => p.num === parseInt(m[1]));
        if (idx >= 0) { pc = idx; continue; }
        pc++; continue;
      }

      // END
      if (upper === 'END') break;

      pc++;
    }
    if (iter >= 10000) printErr('Execution limit reached (10000 iterations)');
  }

  runLoop();
} catch(e) { printErr('Error: ' + e.message); }`;
  return wrapWithRuntime(code, 'BASIC', '', runtimeJs, css);
}
