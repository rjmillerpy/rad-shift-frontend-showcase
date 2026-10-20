import { buildAssembly, buildCobol, buildFortran, buildVisualBasic } from "@/lib/widgetRuntimes/retro";

type Builder = (code: string, css?: string) => string;

/** Load the generated document into jsdom and execute its inline script, as the sandboxed iframe would. */
function run(build: Builder, code: string): string {
  const doc = new DOMParser().parseFromString(build(code), "text/html");
  document.body.innerHTML = doc.body.innerHTML;
  new Function(doc.querySelector("script:not([src])")?.textContent ?? "")();
  return document.getElementById("output")?.textContent ?? "";
}

describe("buildFortran", () => {
  it.each([
    ["WRITE(*,*) of a string", "write(*,*) 'Hello'", "Hello\n"],
    ["WRITE of a double-quoted string", 'WRITE(*,*) "Hi"', "Hi\n"],
    ["a typed declaration with an initial value", "integer :: n = 4\nwrite(*,*) n", "4\n"],
    ["assignment with arithmetic", "integer :: n = 2\nx = n * 3\nwrite(*,*) x", "6\n"],
    ["case-insensitive variable names", "Total = 5\nwrite(*,*) TOTAL", "5\n"],
    ["a DO loop", "do i = 1, 3\nwrite(*,*) i\nend do", "1\n2\n3\n"],
    ["a DO loop closed with ENDDO", "DO I = 1, 2\nWRITE(*,*) I\nENDDO", "1\n2\n"],
    ["nothing after END PROGRAM", "program t\nwrite(*,*) 'a'\nend program t\nwrite(*,*) 'b'", "a\n"],
    ["nothing after STOP", "write(*,*) 'a'\nstop\nwrite(*,*) 'b'", "a\n"],
  ])("prints %s", (_label, program, expected) => {
    expect(run(buildFortran, program)).toBe(expected);
  });
});

describe("buildCobol", () => {
  it.each([
    ["DISPLAY of a literal", 'DISPLAY "HELLO".', "HELLO\n"],
    ["MOVE then DISPLAY", "MOVE 5 TO X.\nDISPLAY X.", "5\n"],
    ["hyphenated data names", "MOVE 7 TO WS-COUNT.\nDISPLAY WS-COUNT.", "7\n"],
    ["ADD and SUBTRACT", "MOVE 5 TO X.\nADD 3 TO X.\nSUBTRACT 2 FROM X.\nDISPLAY X.", "6\n"],
    ["ADD to an undeclared name starts from zero", "ADD 4 TO N.\nDISPLAY N.", "4\n"],
    ["COMPUTE with a variable", "MOVE 6 TO X.\nCOMPUTE Y = X * 2.\nDISPLAY Y.", "12\n"],
    ["several DISPLAY operands joined by spaces", 'MOVE 6 TO X.\nDISPLAY "X" X.', "X 6\n"],
    ["nothing after STOP RUN", 'DISPLAY "A".\nSTOP RUN.\nDISPLAY "B".', "A\n"],
  ])("runs %s", (_label, program, expected) => {
    expect(run(buildCobol, program)).toBe(expected);
  });
});

describe("buildAssembly", () => {
  const reg = (out: string, name: string) => Number(out.match(new RegExp(`${name} = (-?\\d+)`))?.[1]);

  it.each([
    ["mov and add", "mov eax, 5\nadd eax, 3", "EAX", 8],
    ["sub going negative", "mov eax, 2\nsub eax, 5", "EAX", -3],
    ["hex immediates", "mov ebx, 0x1f", "EBX", 31],
    ["mul into eax", "mov eax, 6\nmov ebx, 7\nmul ebx", "EAX", 42],
    ["div quotient", "mov eax, 17\nmov ebx, 5\ndiv ebx", "EAX", 3],
    ["div remainder", "mov eax, 17\nmov ebx, 5\ndiv ebx", "EDX", 2],
    ["push and pop", "mov eax, 9\npush eax\npop ecx", "ECX", 9],
    ["xor clearing a register", "mov eax, 9\nxor eax, eax", "EAX", 0],
    ["a dec/jnz loop", "mov ecx, 3\nloop:\ninc ebx\ndec ecx\njnz loop", "EBX", 3],
    ["cmp/je taking the branch", "mov eax, 1\ncmp eax, 1\nje done\nmov ebx, 99\ndone:\ninc edx", "EBX", 0],
    ["jmp over an instruction", "jmp end\nmov eax, 99\nend:\nnop", "EAX", 0],
    ["hlt stopping execution", "mov eax, 1\nhlt\nmov eax, 2", "EAX", 1],
    ["comments and directives ignored", "; setup\nsection .text\nglobal _start\nmov esi, 4 ; four", "ESI", 4],
  ])("dumps registers after %s", (_label, program, name, value) => {
    const out = run(buildAssembly, program);
    expect(out).toContain("=== Registers ===");
    expect(reg(out, name)).toBe(value);
  });

  it("prints the data string on sys_write and stops at sys_exit", () => {
    const program = 'msg db "Hello", 0xa\nmov eax, 4\nint 0x80\nmov eax, 1\nint 0x80\nmov eax, 4\nint 0x80';
    expect(run(buildAssembly, program)).toBe("Hello\n");
  });

  it("stops a runaway loop instead of hanging", () => {
    expect(run(buildAssembly, "top:\ninc eax\njmp top")).toContain("EAX = ");
  });
});

describe("buildVisualBasic", () => {
  it.each([
    ["MsgBox", 'MsgBox "Hi"', "Hi\n"],
    ["Console.WriteLine", 'Console.WriteLine("Hi")', "Hi\n"],
    ["Debug.Print with arithmetic", "Dim x As Integer = 5\nDebug.Print x + 1", "6\n"],
    ["Dim without a value defaults to 0", "Dim n As Integer\nMsgBox n", "0\n"],
    ["& concatenation", 'Dim x As Integer = 5\nConsole.WriteLine("Total: " & x)', "Total: 5\n"],
    ["case-insensitive variable names", "Dim Total = 3\nMsgBox TOTAL", "3\n"],
    ["plain assignment", "Dim x = 5\ny = x * 2\nMsgBox y", "10\n"],
    ["a Sub called by name and with Call", 'Sub Greet()\nMsgBox "Hi"\nEnd Sub\nGreet\nCall Greet()', "Hi\nHi\n"],
    ["a Sub body only when called", 'Sub Never()\nMsgBox "x"\nEnd Sub\nMsgBox "main"', "main\n"],
  ])("runs %s", (_label, program, expected) => {
    expect(run(buildVisualBasic, program)).toBe(expected);
  });
});

describe.each([
  ["buildFortran", buildFortran, "Fortran", "(No output)\n"],
  ["buildCobol", buildCobol, "COBOL", "(No output)\n"],
  ["buildVisualBasic", buildVisualBasic, "Visual Basic", "(No output)\n"],
  ["buildAssembly", buildAssembly, "Assembly", "=== Registers ===\n  EAX = 0\n"],
] as [string, Builder, string, string][])("%s shared behaviour", (_name, build, label, emptyOutput) => {
  it("reports a placeholder result for an empty program", () => {
    expect(run(build, "").startsWith(emptyOutput)).toBe(true);
  });

  it("labels the loading placeholder and includes user CSS", () => {
    const html = build("", ".mine { color: red; }");
    expect(html).toMatch(/^<!DOCTYPE html>/);
    expect(html).toContain(`Loading ${label} runtime...`);
    expect(html).toContain(".mine { color: red; }");
  });
});
