import { buildCsharp } from "@/lib/widgetRuntimes/csharp";

/** Load the generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(code: string): HTMLElement {
  const doc = new DOMParser().parseFromString(buildCsharp(code), "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output") as HTMLElement;
}

describe("buildCsharp", () => {
  it.each([
    ["a string literal", 'Console.WriteLine("Hello");', "Hello\n"],
    ["Console.Write as well as WriteLine", 'Console.Write("A");\nConsole.WriteLine("B");', "A\nB\n"],
    ["statements indented inside a class body", 'class P {\n  static void Main() {\n    Console.WriteLine("in");\n  }\n}', "in\n"],
    ["an integer variable", "int x = 5;\nConsole.WriteLine(x);", "5\n"],
    ["arithmetic in a declaration", "int x = 2 + 3;\nConsole.WriteLine(x);", "5\n"],
    ["arithmetic in the argument", "var x = 5;\nConsole.WriteLine(x * 2);", "10\n"],
    ["a float literal with f suffix", "float f = 1.5f;\nConsole.WriteLine(f);", "1.5\n"],
    ["a boolean variable", "bool ok = true;\nConsole.WriteLine(ok);", "true\n"],
    ["string + number concatenation", 'int x = 5;\nConsole.WriteLine("n: " + x);', "n: 5\n"],
    ["string interpolation", 'var name = "Bob";\nConsole.WriteLine($"Hi {name}");', "Hi Bob\n"],
    ["interpolation of an unknown name left as written", 'Console.WriteLine($"Hi {nobody}");', "Hi {nobody}\n"],
    ["division by zero yields 0", "Console.WriteLine(4 / 0);", "0\n"],
  ])("prints %s", (_label, program, expected) => {
    expect(run(program).textContent).toBe(expected);
  });

  it.each([
    ["a program with no console output", "class C {}", "(No Console.WriteLine output detected)\n  1 | class C {}\n"],
    ["a two-line program", "int a = 1;\nint b = 2;", "(No Console.WriteLine output detected)\n  1 | int a = 1;\n  2 | int b = 2;\n"],
    ["empty input", "", "(No Console.WriteLine output detected)\n  1 | \n"],
  ])("falls back to a numbered source listing for %s", (_label, program, expected) => {
    expect(run(program).textContent).toBe(expected);
  });

  it("embeds quotes, backslashes and non-ASCII text from the program unchanged", () => {
    expect(run("Console.WriteLine(\"it's \\\\ `${x}` é\");").textContent).toBe("it's \\\\ `${x}` é\n");
  });

  it("labels the loading placeholder as C# and includes user CSS", () => {
    const html = buildCsharp("class C {}", ".mine { color: red; }");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain("Loading C# runtime...");
    expect(html).toContain(".mine { color: red; }");
  });
});
