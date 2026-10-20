import { buildGolang, buildRust } from "@/lib/widgetRuntimes/systems";

type Builder = (code: string, css?: string) => string;

/** Load the generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(build: Builder, code: string): HTMLElement {
  const doc = new DOMParser().parseFromString(build(code), "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output") as HTMLElement;
}

describe("buildGolang", () => {
  it.each([
    ["a string literal", 'fmt.Println("Hello")', "Hello\n"],
    ["Println inside func main", 'package main\nimport "fmt"\nfunc main() {\n\tfmt.Println("in main")\n}', "in main\n"],
    ["a := variable", "x := 5\nfmt.Println(x)", "5\n"],
    ["a var declaration", "var y = 2.5\nfmt.Println(y)", "2.5\n"],
    ["several arguments joined by spaces", 'x := 5\nfmt.Println("sum", x+3)', "sum 8\n"],
    ["arithmetic between variables", "a := 6\nb := 7\nfmt.Println(a * b)", "42\n"],
    ["division by zero yields 0", "fmt.Println(1 / 0)", "0\n"],
    ["a boolean", "ok := true\nfmt.Println(ok)", "true\n"],
    ["Printf with one verb", 'n := 3\nfmt.Printf("Count: %d", n)', "Count: 3\n"],
    ["Printf with no verbs", 'fmt.Printf("plain")', "plain\n"],
  ])("prints %s", (_label, program, expected) => {
    expect(run(buildGolang, program).textContent).toBe(expected);
  });

  it("does not treat package/import/func lines as assignments", () => {
    const output = run(buildGolang, 'package main\nfunc f() { a := 1 }\nfmt.Println(main)');
    expect(output.textContent).toBe("main\n");
  });
});

describe("buildRust", () => {
  it.each([
    ["a plain string", 'println!("Hello, world!");', "Hello, world!\n"],
    ["println! inside fn main", 'fn main() {\n    println!("in main");\n}', "in main\n"],
    ["one placeholder", 'let x = 5;\nprintln!("x = {}", x);', "x = 5\n"],
    ["placeholders filled in order", 'let a = 1;\nlet b = 2;\nprintln!("{} then {}", a, b);', "1 then 2\n"],
    ["a mutable, type-annotated binding", 'let mut name: String = "Bob";\nprintln!("hi {}", name);', "hi Bob\n"],
    ["a float and a bool", 'let f = 1.5;\nlet t = false;\nprintln!("{} {}", f, t);', "1.5 false\n"],
    ["a placeholder with no argument left as written", 'println!("{} and {}", 1);', "1 and {}\n"],
  ])("prints %s", (_label, program, expected) => {
    expect(run(buildRust, program).textContent).toBe(expected);
  });
});

describe.each([
  ["buildGolang", buildGolang, "Go", "(No fmt.Print output detected)", "package main"],
  ["buildRust", buildRust, "Rust", "(No println! output detected)", "fn main() {}"],
] as [string, Builder, string, string, string][])("%s shared behaviour", (_name, build, label, notice, silent) => {
  it("falls back to a numbered source listing when the program prints nothing", () => {
    expect(run(build, silent).textContent).toBe(`${notice}\n  1 | ${silent}\n`);
  });

  it("handles empty input", () => {
    expect(run(build, "").textContent).toBe(`${notice}\n  1 | \n`);
  });

  it("numbers every line of a multi-line listing", () => {
    expect(run(build, "// a\n// b\n// c").textContent).toBe(`${notice}\n  1 | // a\n  2 | // b\n  3 | // c\n`);
  });

  it("labels the loading placeholder and includes user CSS", () => {
    const html = build(silent, ".mine { color: red; }");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain(`Loading ${label} runtime...`);
    expect(html).toContain(".mine { color: red; }");
  });
});
