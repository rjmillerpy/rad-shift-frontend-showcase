// Widget code templates for the displayModifiers category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const displayModifierTemplates: Record<string, string> = {
  python: `# \u{1F3A8} Text Art Generator (Python)
# Runs via Pyodide in the browser. Full standard library available!
# Generates ASCII art banners and text transformations.

FONT = {
    'A': ["  #  ", " # # ", "#####", "#   #", "#   #"],
    'B': ["#### ", "#   #", "#### ", "#   #", "#### "],
    'C': [" ####", "#    ", "#    ", "#    ", " ####"],
    'D': ["#### ", "#   #", "#   #", "#   #", "#### "],
    'E': ["#####", "#    ", "###  ", "#    ", "#####"],
    'H': ["#   #", "#   #", "#####", "#   #", "#   #"],
    'I': ["#####", "  #  ", "  #  ", "  #  ", "#####"],
    'L': ["#    ", "#    ", "#    ", "#    ", "#####"],
    'O': [" ### ", "#   #", "#   #", "#   #", " ### "],
    'R': ["#### ", "#   #", "#### ", "#  # ", "#   #"],
    'W': ["#   #", "#   #", "# # #", "## ##", "#   #"],
    ' ': ["     ", "     ", "     ", "     ", "     "],
}

def banner(text: str) -> str:
    """Generate a large ASCII art banner."""
    text = text.upper()
    lines = [""] * 5
    for char in text:
        glyph = FONT.get(char, FONT[' '])
        for i in range(5):
            lines[i] += glyph[i] + " "
    return "\\n".join(lines)

def box_text(text: str, style: str = "double") -> str:
    """Wrap text in a decorative box."""
    borders = {
        "single": ("\u250C", "\u2510", "\u2514", "\u2518", "\u2500", "\u2502"),
        "double": ("\u2554", "\u2557", "\u255A", "\u255D", "\u2550", "\u2551"),
        "bold":   ("\u250F", "\u2513", "\u2517", "\u251B", "\u2501", "\u2503"),
    }
    tl, tr, bl, br, h, v = borders.get(style, borders["single"])
    width = len(text) + 4
    top = tl + h * width + tr
    bot = bl + h * width + br
    mid = f"{v}  {text}  {v}"
    return f"{top}\\n{mid}\\n{bot}"

def transform(text: str, style: str) -> str:
    """Apply text transformation."""
    transforms = {
        "upper": text.upper(),
        "lower": text.lower(),
        "title": text.title(),
        "reverse": text[::-1],
        "leetspeak": text.replace('e','3').replace('a','4').replace('o','0').replace('l','1').replace('t','7'),
        "wave": "".join(c.upper() if i % 2 == 0 else c.lower() for i, c in enumerate(text)),
    }
    return transforms.get(style, text)

print("\u{1F3A8} Text Art Generator")
print("=" * 40)
print()
print(banner("HELLO"))
print()
print(box_text("Welcome to RadShift!", "double"))
print(box_text("Python is awesome", "bold"))
print()
for style in ["wave", "leetspeak", "reverse"]:
    print(f"  {style:>10}: {transform('Hello World', style)}")

# --- How to modify ---
# - Add more characters to the FONT dictionary
# - Implement color codes for terminal output
# - Add shadow effects to the banner text
# - Create a figlet-style font loader`,

  javascript: `// \u{1F3A8} CSS Theme Switcher
// Runs directly in the browser with full DOM access.
// Applies dynamic themes and visual transformations.

export const themes = {
  cyberpunk: {
    bg: '#0a0a1a', text: '#00ff41', accent: '#ff00ff',
    font: "'Courier New', monospace", border: '#00ff41'
  },
  sunset: {
    bg: '#1a0a0a', text: '#ffd700', accent: '#ff6347',
    font: 'Georgia, serif', border: '#ff6347'
  },
  ocean: {
    bg: '#0a1a2a', text: '#87ceeb', accent: '#00bfff',
    font: "'Segoe UI', sans-serif", border: '#00bfff'
  },
  forest: {
    bg: '#0a1a0a', text: '#90ee90', accent: '#228b22',
    font: "'Trebuchet MS', sans-serif", border: '#228b22'
  },
};

export const container = document.getElementById('output');
container.innerHTML = \`
  <div id="themed" style="padding:16px;font-family:system-ui;transition:all 0.3s">
    <h2 style="margin:0 0 12px">\u{1F3A8} Theme Switcher</h2>
    <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap" id="buttons"></div>
    <div id="preview" style="border:2px solid #333;border-radius:8px;padding:16px;transition:all 0.3s">
      <h3>Preview Content</h3>
      <p>This text changes style with each theme. Try them all!</p>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>
      <code style="display:block;margin-top:8px;padding:8px;border-radius:4px">
        const greeting = "Hello, themed world!";
      </code>
    </div>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button onclick="applyFilter('none')" style="padding:6px 12px;border:1px solid #333;border-radius:4px;background:#222;color:#ccc;cursor:pointer">Normal</button>
      <button onclick="applyFilter('blur(2px)')" style="padding:6px 12px;border:1px solid #333;border-radius:4px;background:#222;color:#ccc;cursor:pointer">Blur</button>
      <button onclick="applyFilter('grayscale(1)')" style="padding:6px 12px;border:1px solid #333;border-radius:4px;background:#222;color:#ccc;cursor:pointer">Grayscale</button>
      <button onclick="applyFilter('sepia(1)')" style="padding:6px 12px;border:1px solid #333;border-radius:4px;background:#222;color:#ccc;cursor:pointer">Sepia</button>
      <button onclick="applyFilter('invert(1)')" style="padding:6px 12px;border:1px solid #333;border-radius:4px;background:#222;color:#ccc;cursor:pointer">Invert</button>
    </div>
  </div>
\`;

export const btnContainer = document.getElementById('buttons');
Object.keys(themes).forEach(name => {
  const btn = document.createElement('button');
  btn.textContent = name.charAt(0).toUpperCase() + name.slice(1);
  btn.style.cssText = \`padding:8px 16px;border:none;border-radius:6px;cursor:pointer;
    background:\${themes[name].accent};color:\${themes[name].bg};font-weight:bold\`;
  btn.onclick = () => applyTheme(name);
  btnContainer.appendChild(btn);
});

function applyTheme(name) {
  const t = themes[name];
  const el = document.getElementById('themed');
  el.style.background = t.bg;
  el.style.color = t.text;
  el.style.fontFamily = t.font;
  document.getElementById('preview').style.borderColor = t.border;
}

function applyFilter(filter) {
  document.getElementById('preview').style.filter = filter;
}

// --- How to modify ---
// - Add more themes (dracula, solarized, nord)
// - Implement custom theme builder with color pickers
// - Add animation effects (fade, slide, bounce)
// - Save preferred theme to localStorage`,

  typescript: `// \u{1F3A8} Image Filter Pipeline (TypeScript)
// Transpiled and run in the browser with type checking.
// Applies CSS filters and canvas manipulations to images.

type FilterName = 'grayscale' | 'sepia' | 'blur' | 'brightness' | 'contrast' | 'hueRotate' | 'invert';

interface Filter {
  name: FilterName;
  value: number;
  unit: string;
  min: number;
  max: number;
}

interface FilterPipeline {
  filters: Filter[];
  toCss(): string;
}

export const createPipeline = (): FilterPipeline => {
  const filters: Filter[] = [];
  return {
    filters,
    toCss() {
      return filters.map(f => {
        const cssName = f.name === 'hueRotate' ? 'hue-rotate' : f.name;
        return \`\${cssName}(\${f.value}\${f.unit})\`;
      }).join(' ');
    },
  };
};

export const output = document.getElementById('output')!;
output.innerHTML = \`
  <div style="font-family:system-ui;padding:4px">
    <h3 style="color:#89b4fa;margin:0 0 12px">\u{1F3A8} Filter Pipeline</h3>
    <div id="controls" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px"></div>
    <div id="sample" style="width:300px;height:200px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;
      font-size:24px;font-weight:bold;transition:filter 0.3s">Sample</div>
    <pre id="css-output" style="background:#161b22;padding:8px;border-radius:6px;font-size:11px;margin-top:12px;color:#7ee787"></pre>
  </div>
\`;

export const pipeline = createPipeline();
export const filterDefs: Filter[] = [
  { name: 'grayscale', value: 0, unit: '%', min: 0, max: 100 },
  { name: 'sepia', value: 0, unit: '%', min: 0, max: 100 },
  { name: 'blur', value: 0, unit: 'px', min: 0, max: 10 },
  { name: 'brightness', value: 100, unit: '%', min: 0, max: 200 },
  { name: 'contrast', value: 100, unit: '%', min: 0, max: 200 },
  { name: 'hueRotate', value: 0, unit: 'deg', min: 0, max: 360 },
];

filterDefs.forEach(def => pipeline.filters.push({ ...def }));

export const controlsEl = document.getElementById('controls')!;
pipeline.filters.forEach((f, i) => {
  const div = document.createElement('div');
  div.innerHTML = \`<label style="font-size:12px;color:#888">\${f.name}</label><br>
    <input type="range" min="\${f.min}" max="\${f.max}" value="\${f.value}"
      style="width:120px" data-index="\${i}">\`;
  div.querySelector('input')!.addEventListener('input', (e) => {
    const input = e.target as HTMLInputElement;
    pipeline.filters[+input.dataset.index!].value = +input.value;
    applyFilters();
  });
  controlsEl.appendChild(div);
});

function applyFilters(): void {
  const css = pipeline.toCss();
  (document.getElementById('sample') as HTMLElement).style.filter = css;
  document.getElementById('css-output')!.textContent = \`filter: \${css || 'none'};\`;
}
applyFilters();

// --- How to modify ---
// - Add canvas-based pixel manipulation (posterize, pixelate)
// - Implement filter presets (vintage, noir, warm, cool)
// - Add drag-and-drop image upload
// - Export filtered image as downloadable PNG`,

  c: `// \u{1F3A8} ANSI Color Demo (C)
// Runs via JSCPP interpreter in the browser.
// Demonstrates text formatting and color output.

#include <stdio.h>
#include <string.h>

void print_header(const char *text) {
    int len = strlen(text);
    printf("\\n+");
    for (int i = 0; i < len + 4; i++) printf("-");
    printf("+\\n");
    printf("|  %s  |\\n", text);
    printf("+");
    for (int i = 0; i < len + 4; i++) printf("-");
    printf("+\\n\\n");
}

void print_table(const char *headers[], int cols,
                 const char *data[][4], int rows) {
    int widths[4] = {12, 12, 12, 12};

    // Header row
    printf("  ");
    for (int c = 0; c < cols; c++) {
        printf("%-*s", widths[c], headers[c]);
        if (c < cols - 1) printf(" | ");
    }
    printf("\\n  ");
    for (int c = 0; c < cols; c++) {
        for (int i = 0; i < widths[c]; i++) printf("-");
        if (c < cols - 1) printf("-+-");
    }
    printf("\\n");

    // Data rows
    for (int r = 0; r < rows; r++) {
        printf("  ");
        for (int c = 0; c < cols; c++) {
            printf("%-*s", widths[c], data[r][c]);
            if (c < cols - 1) printf(" | ");
        }
        printf("\\n");
    }
}

int main() {
    print_header("Display Modifier Demo");

    const char *headers[] = {"Style", "Example", "Usage"};
    const char *data[][4] = {
        {"Bold",      "**text**",  "Emphasis"},
        {"Italic",    "*text*",    "Subtle"},
        {"Underline", "_text_",    "Links"},
        {"Code",      "'text'",    "Technical"},
    };
    print_table(headers, 3, data, 4);

    printf("\\n  Text transformations:\\n");
    const char *word = "Hello World";
    printf("    Original:  %s\\n", word);
    printf("    Uppercase: ");
    for (int i = 0; word[i]; i++) {
        char c = word[i];
        if (c >= 'a' && c <= 'z') c -= 32;
        printf("%c", c);
    }
    printf("\\n    Reversed:  ");
    int len = strlen(word);
    for (int i = len - 1; i >= 0; i--) printf("%c", word[i]);
    printf("\\n");

    return 0;
}

// --- How to modify ---
// - Add more text transformations (Caesar cipher, ROT13)
// - Implement a simple markup parser
// - Add box-drawing with Unicode characters
// - Create a progress bar renderer`,

  sql: `-- \u{1F3A8} Data Display Formatter (SQL)
-- Executed via sql.js (SQLite compiled to WebAssembly).
-- Formats and transforms data for display.

-- Create a product catalog table
CREATE TABLE catalog (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price REAL,
    rating REAL,
    stock INTEGER
);

INSERT INTO catalog VALUES (1, 'Wireless Mouse', 'Electronics', 29.99, 4.5, 150);
INSERT INTO catalog VALUES (2, 'Mechanical Keyboard', 'Electronics', 89.99, 4.8, 75);
INSERT INTO catalog VALUES (3, 'USB-C Hub', 'Accessories', 39.99, 4.2, 200);
INSERT INTO catalog VALUES (4, 'Monitor Stand', 'Furniture', 49.99, 3.9, 50);
INSERT INTO catalog VALUES (5, 'Desk Lamp', 'Furniture', 34.99, 4.1, 120);
INSERT INTO catalog VALUES (6, 'Webcam HD', 'Electronics', 59.99, 4.6, 90);

-- Formatted price display with visual rating
SELECT
    name,
    category,
    '$' || printf('%.2f', price) AS formatted_price,
    CASE
        WHEN rating >= 4.5 THEN '\u2605\u2605\u2605\u2605\u2605'
        WHEN rating >= 4.0 THEN '\u2605\u2605\u2605\u2605\u2606'
        WHEN rating >= 3.5 THEN '\u2605\u2605\u2605\u2606\u2606'
        ELSE '\u2605\u2605\u2606\u2606\u2606'
    END AS stars,
    CASE
        WHEN stock > 100 THEN 'In Stock'
        WHEN stock > 20 THEN 'Low Stock'
        ELSE 'Critical'
    END AS availability
FROM catalog
ORDER BY rating DESC;

-- Category summary with bar-style display
SELECT
    category,
    COUNT(*) AS items,
    ROUND(AVG(price), 2) AS avg_price,
    ROUND(AVG(rating), 1) AS avg_rating,
    SUM(stock) AS total_stock
FROM catalog
GROUP BY category;

-- --- How to modify ---
-- Add a 'discount' column and calculate sale prices
-- Create conditional formatting with more CASE expressions
-- Add date-based display (new arrivals, seasonal items)
-- Build a search query with LIKE patterns`,

  ruby: `# \u{1F3A8} Terminal UI Components (Ruby)
# Interpreted via Opal (Ruby-to-JS compiler) in the browser.
# Build beautiful text-based UI elements with Ruby.

module TermUI
  COLORS = {
    red: "\\e[31m", green: "\\e[32m", yellow: "\\e[33m",
    blue: "\\e[34m", magenta: "\\e[35m", cyan: "\\e[36m",
    reset: "\\e[0m"
  }

  def self.progress_bar(percent, width: 30, fill: "\u2588", empty: "\u2591")
    filled = (width * percent / 100.0).round
    bar = fill * filled + empty * (width - filled)
    "[#{bar}] #{percent}%"
  end

  def self.table(headers, rows, padding: 2)
    widths = headers.each_with_index.map do |h, i|
      [h.length, *rows.map { |r| r[i].to_s.length }].max + padding
    end

    divider = "+" + widths.map { |w| "-" * w }.join("+") + "+"
    format_row = ->(row) { "|" + row.each_with_index.map { |c, i| c.to_s.center(widths[i]) }.join("|") + "|" }

    puts divider
    puts format_row.call(headers)
    puts divider
    rows.each { |row| puts format_row.call(row) }
    puts divider
  end

  def self.sparkline(data, chars: "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588")
    min, max = data.minmax
    range = max - min
    return chars[-1] * data.length if range == 0
    data.map { |v| chars[((v - min) / range.to_f * (chars.length - 1)).round] }.join
  end
end

puts "\u{1F3A8} Terminal UI Components"
puts "=" * 40

# Progress bars
puts "\\nDownload Progress:"
[25, 50, 75, 100].each do |pct|
  puts "  #{TermUI.progress_bar(pct)}"
end

# Table
puts ""
TermUI.table(
  ["Name", "Role", "Status"],
  [
    ["Alice", "Admin", "Active"],
    ["Bob", "Editor", "Active"],
    ["Carol", "Viewer", "Inactive"],
  ]
)

# Sparklines
puts "\\nServer Load (24h):"
data = [3, 5, 8, 12, 7, 4, 6, 9, 15, 11, 8, 5]
puts "  #{TermUI.sparkline(data)}"

# --- How to modify ---
# - Add color support for different status indicators
# - Implement a tree view for hierarchical data
# - Add spinner animations for loading states
# - Create a horizontal bar chart renderer`,
};

// ---------------------------------------------------------------------------
// LAMBDA templates
// ---------------------------------------------------------------------------
