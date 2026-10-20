import { waitFor } from "@testing-library/react";
import {
  buildCpp, buildLua, buildPhp, buildPython, buildRuby, buildSql, buildTypeScript,
} from "@/lib/widgetRuntimes/scripting";

type Builder = (code: string, css?: string) => string;
const parse = (html: string) => new DOMParser().parseFromString(html, "text/html");

/** Load a generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(html: string): HTMLElement {
  const doc = parse(html);
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output") as HTMLElement;
}

// Each interpreter is a CDN-loaded global, i.e. an external boundary; the tests stand in for it.
const globals = globalThis as unknown as Record<string, unknown>;
afterEach(() => {
  for (const name of ["loadPyodide", "PHP", "initSqlJs", "JSCPP", "ts"]) delete globals[name];
  document.head.innerHTML = "";
});

describe.each([
  ["buildPython", buildPython, "Python", "pyodide"],
  ["buildRuby", buildRuby, "Ruby", "ruby-head-wasm-wasi"],
  ["buildPhp", buildPhp, "PHP", "php-wasm"],
  ["buildSql", buildSql, "SQL", "sql-wasm.js"],
  ["buildLua", buildLua, "Lua", "fengari-web"],
  ["buildCpp", buildCpp, "C/C++", "JSCPP"],
] as [string, Builder, string, string][])("%s document", (_name, build, label, interpreter) => {
  it(`loads the ${interpreter} interpreter over https before the runner and labels the placeholder`, () => {
    const doc = parse(build("code", ".mine { color: red; }"));
    const sources = Array.from(doc.querySelectorAll("script"), (s) => s.getAttribute("src"));
    expect(sources).toEqual([expect.stringMatching(new RegExp(`^https://.*${interpreter}`)), null]);
    expect(doc.getElementById("output")?.textContent).toContain(`Loading ${label} runtime...`);
    expect(doc.querySelector("style")?.textContent).toContain(".mine { color: red; }");
  });
});

const TRICKY = "print('it\\'s') # \"q\" \\ `${x}`\nsecond line";

describe("buildPython", () => {
  it("hands the user's code to Pyodide unchanged and routes stdout/stderr to the page", async () => {
    const runPythonAsync = jest.fn();
    globals.loadPyodide = async () => {
      let out: (msg: string) => void = () => {};
      let err: (msg: string) => void = () => {};
      runPythonAsync.mockImplementation(async () => { out("hello"); err("warned"); });
      return {
        setStdout: (o: { batched: typeof out }) => { out = o.batched; },
        setStderr: (o: { batched: typeof err }) => { err = o.batched; },
        runPythonAsync,
      };
    };
    const output = run(buildPython(TRICKY));
    await waitFor(() => expect(output.textContent).toBe("hello\nwarned\n"));
    expect(runPythonAsync).toHaveBeenCalledWith(TRICKY);
    expect(output.querySelector(".error")?.textContent).toBe("warned");
  });

  it("reports an interpreter failure as an error line", async () => {
    globals.loadPyodide = async () => { throw new Error("no wasm"); };
    const output = run(buildPython("x"));
    await waitFor(() => expect(output.querySelector(".error")?.textContent).toBe("Error: no wasm"));
  });
});

describe("buildPhp", () => {
  it("runs the user's code and prints stdout and stderr", async () => {
    const phpRun = jest.fn<Promise<{ stdout: string; stderr: string }>, [string]>(async () => ({ stdout: "out", stderr: "notice" }));
    globals.PHP = class { init = async () => {}; run = phpRun; };
    const output = run(buildPhp(TRICKY));
    await waitFor(() => expect(output.textContent).toBe("out\nnotice\n"));
    expect(phpRun).toHaveBeenCalledWith(TRICKY);
  });
});

describe("buildSql", () => {
  it("executes each statement and prints result tables, OK for no rows, and per-statement errors", async () => {
    const exec = jest.fn((stmt: string) => {
      if (stmt.includes("SELECT")) return [{ columns: ["id", "name"], values: [[1, "Ada"], [2, "Bob"]] }];
      if (stmt.includes("BROKEN")) throw new Error("syntax error");
      return [];
    });
    globals.initSqlJs = async () => ({ Database: class { exec = exec; } });
    const output = run(buildSql("CREATE TABLE t (id);\nSELECT * FROM t;\nBROKEN;\n  \n"));
    await waitFor(() => expect(exec).toHaveBeenCalledTimes(3));
    expect(exec.mock.calls.map(([stmt]) => stmt.trim())).toEqual(["CREATE TABLE t (id)", "SELECT * FROM t", "BROKEN"]);
    expect(output.textContent).toBe("OK\n\nid | name\n---------\n1 | Ada\n2 | Bob\n\nSQL Error: syntax error\n\n");
  });
});

describe("buildCpp", () => {
  it("runs the user's code through JSCPP and prints what it writes to stdio", () => {
    const jscppRun = jest.fn((_code: string, _stdin: string, config: { stdio: { write: (s: string) => void } }) => {
      config.stdio.write("42");
    });
    globals.JSCPP = { run: jscppRun };
    expect(run(buildCpp(TRICKY)).textContent).toBe("42\n");
    expect(jscppRun).toHaveBeenCalledWith(TRICKY, "", expect.anything());
  });

  it("reports a compile error as an error line", () => {
    globals.JSCPP = { run: () => { throw new Error("1:1 expected ;"); } };
    expect(run(buildCpp("int")).querySelector(".error")?.textContent).toBe("Error: 1:1 expected ;");
  });
});

describe.each([
  ["buildLua", buildLua, "application/lua"],
  ["buildRuby", buildRuby, "text/ruby"],
] as [string, Builder, string][])("%s", (_name, build, scriptType) => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it(`appends a ${scriptType} script that redirects output to #output and ends with the user's code`, () => {
    run(build(TRICKY));
    const script = document.querySelector(`script[type="${scriptType}"]`);
    expect(script?.textContent?.endsWith(TRICKY)).toBe(true);
    expect(script?.textContent).toContain('getElementById("output")');
  });
});

describe("buildRuby", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("tells the user the runtime is still loading if nothing was printed after 3 seconds", () => {
    const output = run(buildRuby("puts 1"));
    jest.advanceTimersByTime(2999);
    expect(output.textContent).toBe("");
    jest.advanceTimersByTime(1);
    expect(output.textContent).toBe("Ruby runtime loading... Please wait.\n");
  });

  it("leaves real output alone once the runtime has printed", () => {
    const output = run(buildRuby("puts 1"));
    output.textContent = "1\n";
    jest.advanceTimersByTime(3000);
    expect(output.textContent).toBe("1\n");
  });
});

describe("buildTypeScript", () => {
  const compiler = () => document.head.querySelector<HTMLScriptElement>('script[src*="typescript"]');

  it("loads the compiler, transpiles the user's code to ES2020 and runs the result", () => {
    const transpile = jest.fn<string, [string, unknown]>(() => 'console.log("typed", 2); console.error("oops");');
    globals.ts = { transpile, ScriptTarget: { ES2020: 7 } };
    const { log, error } = console;
    const output = run(buildTypeScript(TRICKY));
    expect(output.textContent).toBe("");

    compiler()?.dispatchEvent(new Event("load"));
    expect(transpile).toHaveBeenCalledWith(TRICKY, { target: 7 });
    expect(output.textContent).toBe("typed 2\noops\n");
    expect([console.log, console.error]).toEqual([log, error]);
  });

  it.each([
    ["a transpile failure", "load", "Error: bad types"],
    ["the compiler failing to load", "error", "Failed to load TypeScript compiler"],
  ])("reports %s as an error line", (_label, event, message) => {
    globals.ts = { transpile: () => { throw new Error("bad types"); }, ScriptTarget: { ES2020: 7 } };
    const output = run(buildTypeScript("let x: number = 1;"));
    compiler()?.dispatchEvent(new Event(event));
    expect(output.querySelector(".error")?.textContent).toBe(message);
  });
});
