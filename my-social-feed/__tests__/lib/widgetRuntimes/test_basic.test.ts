import { fireEvent } from "@testing-library/react";
import { buildBasic } from "@/lib/widgetRuntimes/basic";
import { gameTemplates } from "@/lib/widgetTemplates/games";

/** Load the generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(code: string): HTMLElement {
  const doc = new DOMParser().parseFromString(buildBasic(code), "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output") as HTMLElement;
}

function answer(value: string) {
  const box = document.getElementById("basic-input") as HTMLElement;
  fireEvent.change(box.querySelector("input") as HTMLInputElement, { target: { value } });
  fireEvent.click(box.querySelector("button") as HTMLButtonElement);
}

describe("buildBasic", () => {
  it.each([
    ["PRINT of a string literal", '10 PRINT "HELLO"', "HELLO\n"],
    ["statements without line numbers", 'PRINT "A"\nPRINT "B"', "A\nB\n"],
    ["lower-case keywords", 'print "hi"', "hi\n"],
    ["LET with arithmetic on a variable", '10 LET A = 2\n20 LET B = A * 3\n30 PRINT "B="; B', "B=6\n"],
    ["assignment without LET", '10 X = 7\n20 PRINT X', "7\n"],
    ["string concatenation with a number", '10 LET N = 3\n20 PRINT "N" + N', "N3\n"],
    ["division by zero yields 0", "10 PRINT 5 / 0", "0\n"],
    ["FOR/NEXT counting up", "10 FOR I = 1 TO 3\n20 PRINT I\n30 NEXT I", "1\n2\n3\n"],
    ["FOR/NEXT with a negative STEP", "10 FOR I = 3 TO 1 STEP -1\n20 PRINT I\n30 NEXT I", "3\n2\n1\n"],
    ["IF/THEN PRINT only when true", '10 LET A = 5\n20 IF A > 3 THEN PRINT "BIG"\n30 IF A < 3 THEN PRINT "SMALL"', "BIG\n"],
    ["IF with = and <> comparisons", '10 LET A = 5\n20 IF A = 5 THEN PRINT "EQ"\n30 IF A <> 5 THEN PRINT "NE"', "EQ\n"],
    ["IF/THEN assignment", "10 LET A = 1\n20 IF A = 1 THEN A = 9\n30 PRINT A", "9\n"],
    ["GOTO skips lines", '10 GOTO 30\n20 PRINT "SKIPPED"\n30 PRINT "DONE"', "DONE\n"],
    ["IF/THEN GOTO loop", '10 LET I = 0\n20 LET I = I + 1\n30 IF I < 3 THEN GOTO 20\n40 PRINT I', "3\n"],
    ["REM lines are ignored", '10 REM PRINT "NO"\n20 PRINT "YES"', "YES\n"],
    ["END stops the program", '10 PRINT "A"\n20 END\n30 PRINT "B"', "A\n"],
    ["empty program prints nothing", "", ""],
  ])("runs %s", (_label, program, expected) => {
    expect(run(program).textContent).toBe(expected);
  });

  it("aborts a runaway loop with an execution-limit error instead of hanging", () => {
    const output = run("10 GOTO 10");
    expect(output.querySelector(".error")?.textContent).toBe("Execution limit reached (10000 iterations)");
  });

  it("embeds quotes, backslashes and non-ASCII text from the program unchanged", () => {
    expect(run('10 PRINT "it\'s a \\ back`tick ${x} é"').textContent).toBe("it's a \\ back`tick ${x} é\n");
  });

  it("pauses at INPUT, shows the prompt, and resumes with the typed number", () => {
    const output = run('10 INPUT "How many", N\n20 PRINT N * 2');
    const box = document.getElementById("basic-input") as HTMLElement;
    expect(output.textContent).toBe("");
    expect(box.style.display).toBe("block");
    expect(box.querySelector("span")?.textContent).toBe("How many ");

    answer("21");
    expect(output.textContent).toBe("42\n");
    expect(box.style.display).toBe("none");
  });

  it("uses the variable name as the prompt and accepts Enter for a text answer", () => {
    const output = run('10 INPUT name\n20 PRINT "HI "; NAME');
    const box = document.getElementById("basic-input") as HTMLElement;
    const field = box.querySelector("input") as HTMLInputElement;
    expect(box.querySelector("span")?.textContent).toBe("NAME? ");

    fireEvent.change(field, { target: { value: "ada" } });
    fireEvent.keyDown(field, { key: "Enter" });
    expect(output.textContent).toBe("HI ada\n");
  });

  it("plays the BASIC game starter template through to a win", () => {
    const output = run(gameTemplates.basic);
    expect(output.textContent).toContain("Number Guessing Game!");
    expect(document.querySelector("#basic-input span")?.textContent).toBe("Your guess ");

    answer("10");
    expect(output.textContent).toContain("Too LOW! Try higher.");
    answer("90");
    expect(output.textContent).toContain("Too HIGH! Try lower.");
    answer("42");
    expect(output.textContent).toContain("Correct! The number was 42");
    expect(output.textContent).toContain("You got it in 3 tries!");
    expect(output.textContent?.trimEnd().endsWith("Thanks for playing!")).toBe(true);
    expect(document.getElementById("basic-input")?.style.display).toBe("none");
  });

  it("includes user CSS in the document", () => {
    expect(buildBasic('10 PRINT "A"', ".mine { color: red; }")).toContain(".mine { color: red; }");
  });
});
