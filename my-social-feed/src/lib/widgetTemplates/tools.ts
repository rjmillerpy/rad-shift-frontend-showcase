// Widget code templates for the tools category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const toolTemplates: Record<string, string> = {
  python: `# \u{1F6E0}\uFE0F Unit Converter & Calculator
# Runs via Pyodide in the browser. Full Python standard library available!
# This tool converts between common units using Python's clean syntax.

from dataclasses import dataclass
from typing import Dict, Callable

@dataclass
class Unit:
    name: str
    to_base: float  # multiplier to convert to base unit

# Length units (base: meters)
LENGTH: Dict[str, Unit] = {
    "meters": Unit("meters", 1.0),
    "feet": Unit("feet", 0.3048),
    "inches": Unit("inches", 0.0254),
    "km": Unit("km", 1000.0),
    "miles": Unit("miles", 1609.34),
    "yards": Unit("yards", 0.9144),
}

# Temperature converters
def celsius_to_fahrenheit(c: float) -> float:
    return c * 9/5 + 32

def fahrenheit_to_celsius(f: float) -> float:
    return (f - 32) * 5/9

def convert_length(value: float, from_unit: str, to_unit: str) -> float:
    """Convert between any two length units."""
    base_value = value * LENGTH[from_unit].to_base
    return base_value / LENGTH[to_unit].to_base

# Demo conversions
print("\u{1F6E0}\uFE0F Unit Converter")
print("=" * 40)

conversions = [
    (1, "miles", "km"),
    (100, "meters", "feet"),
    (5280, "feet", "miles"),
    (10, "km", "yards"),
]

for val, fr, to in conversions:
    result = convert_length(val, fr, to)
    print(f"  {val} {fr} = {result:.4f} {to}")

print(f"\\n  100\u00B0C = {celsius_to_fahrenheit(100):.1f}\u00B0F")
print(f"  72\u00B0F = {fahrenheit_to_celsius(72):.1f}\u00B0C")

# --- How to modify ---
# - Add weight units (kg, lbs, oz, grams)
# - Add time units (seconds, minutes, hours, days)
# - Create a currency converter with exchange rates
# - Add input() for interactive use (works in Pyodide terminal mode)`,

  javascript: `// \u{1F6E0}\uFE0F Markdown Previewer
// Runs directly in the browser with full DOM access.
// Type Markdown on the left, see rendered HTML on the right.

export const container = document.getElementById('output');
container.innerHTML = \`
  <div style="display:flex;gap:12px;height:90vh;font-family:system-ui">
    <div style="flex:1;display:flex;flex-direction:column">
      <h3 style="color:#89b4fa;margin:0 0 8px">\u270F\uFE0F Markdown</h3>
      <textarea id="md-input" style="flex:1;background:#0d0d1a;color:#a6e3a1;border:1px solid #333;
        border-radius:6px;padding:12px;font-family:monospace;font-size:13px;resize:none"># Hello World

This is a **Markdown** previewer!

## Features
- Bold with **double asterisks**
- Italic with *single asterisks*
- Code with \\\`backticks\\\`
- Links: [Example](https://example.com)

> Blockquotes work too!

\\\`\\\`\\\`
code blocks are supported
\\\`\\\`\\\`</textarea>
    </div>
    <div style="flex:1;display:flex;flex-direction:column">
      <h3 style="color:#89b4fa;margin:0 0 8px">\u{1F441}\uFE0F Preview</h3>
      <div id="md-preview" style="flex:1;background:#16213e;border:1px solid #333;
        border-radius:6px;padding:12px;overflow:auto;font-size:14px;line-height:1.6"></div>
    </div>
  </div>
\`;

function renderMarkdown(text) {
  return text
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="color:#89b4fa">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 style="color:#89b4fa">$1</h1>')
    .replace(/\\\`\\\`\\\`([\\\\s\\\\S]*?)\\\`\\\`\\\`/g, '<pre style="background:#0d0d1a;padding:8px;border-radius:4px"><code>$1</code></pre>')
    .replace(/\\\`([^\\\`]+)\\\`/g, '<code style="background:#0d0d1a;padding:2px 6px;border-radius:3px">$1</code>')
    .replace(/\\*\\*(.+?)\\*\\*/g, '<strong>$1</strong>')
    .replace(/\\*(.+?)\\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<blockquote style="border-left:3px solid #6c5ce7;padding-left:12px;color:#888">$1</blockquote>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/\\[(.+?)\\]\\((.+?)\\)/g, '<a href="$2" style="color:#58a6ff">$1</a>')
    .replace(/\\n/g, '<br>');
}

export const input = document.getElementById('md-input');
export const preview = document.getElementById('md-preview');

function update() {
  preview.innerHTML = renderMarkdown(input.value);
}

input.addEventListener('input', update);
update();

// --- How to modify ---
// - Add more Markdown features (tables, images, horizontal rules)
// - Add syntax highlighting for code blocks
// - Implement a toolbar with formatting buttons
// - Add export-to-HTML functionality`,

  typescript: `// \u{1F6E0}\uFE0F Password Generator (TypeScript)
// Transpiled and run in the browser with type checking.
// Generates secure passwords with configurable options.

interface PasswordOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}

interface PasswordResult {
  password: string;
  strength: 'weak' | 'medium' | 'strong' | 'very-strong';
  entropy: number;
}

export const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

function generatePassword(options: PasswordOptions): PasswordResult {
  let chars = '';
  if (options.uppercase) chars += CHARSETS.uppercase;
  if (options.lowercase) chars += CHARSETS.lowercase;
  if (options.numbers) chars += CHARSETS.numbers;
  if (options.symbols) chars += CHARSETS.symbols;

  if (!chars) chars = CHARSETS.lowercase + CHARSETS.numbers;

  const password = Array.from({ length: options.length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');

  const poolSize = chars.length;
  const entropy = Math.log2(Math.pow(poolSize, options.length));
  const strength: PasswordResult['strength'] =
    entropy < 28 ? 'weak' :
    entropy < 36 ? 'medium' :
    entropy < 60 ? 'strong' : 'very-strong';

  return { password, strength, entropy };
}

// Generate a batch of passwords with different configs
export const configs: PasswordOptions[] = [
  { length: 8, uppercase: true, lowercase: true, numbers: true, symbols: false },
  { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true },
  { length: 24, uppercase: true, lowercase: true, numbers: true, symbols: true },
  { length: 12, uppercase: false, lowercase: true, numbers: false, symbols: false },
];

export const output = document.getElementById('output')!;
output.innerHTML = '<h2 style="color:#89b4fa;font-family:system-ui">\u{1F510} Password Generator</h2>';

for (const config of configs) {
  const result = generatePassword(config);
  const color = { weak: '#f38ba8', medium: '#fab387', strong: '#a6e3a1', 'very-strong': '#89b4fa' }[result.strength];
  output.innerHTML += \`<div style="font-family:monospace;margin:8px 0;padding:8px;background:#16213e;border-radius:6px">
    <code style="font-size:14px">\${result.password}</code>
    <span style="color:\${color};margin-left:12px;font-size:12px">\${result.strength} (\${result.entropy.toFixed(0)} bits)</span>
  </div>\`;
}

// --- How to modify ---
// - Add a copy-to-clipboard button for each password
// - Implement pronounceable password generation
// - Add a passphrase generator using word lists
// - Create an interactive UI with sliders for options`,

  c: `// \u{1F6E0}\uFE0F Text Statistics Analyzer (C)
// Runs via JSCPP interpreter in the browser.
// Supports: stdio, stdlib, string, math, ctype headers.

#include <stdio.h>
#include <string.h>
#include <ctype.h>

void analyze_text(const char *text) {
    int chars = 0, words = 0, lines = 1;
    int letters = 0, digits = 0, spaces = 0, punct = 0;
    int in_word = 0;
    int freq[26] = {0};

    for (int i = 0; text[i]; i++) {
        chars++;
        char c = text[i];
        if (isalpha(c)) {
            letters++;
            freq[tolower(c) - 'a']++;
        }
        if (isdigit(c)) digits++;
        if (isspace(c)) spaces++;
        if (ispunct(c)) punct++;
        if (c == '\\n') lines++;

        if (isalnum(c)) {
            if (!in_word) { words++; in_word = 1; }
        } else {
            in_word = 0;
        }
    }

    printf("=== Text Statistics ===\\n");
    printf("Characters: %d\\n", chars);
    printf("Words:      %d\\n", words);
    printf("Lines:      %d\\n", lines);
    printf("Letters:    %d\\n", letters);
    printf("Digits:     %d\\n", digits);
    printf("Spaces:     %d\\n", spaces);
    printf("Punctuation:%d\\n", punct);

    printf("\\nLetter frequency:\\n");
    for (int i = 0; i < 26; i++) {
        if (freq[i] > 0) {
            printf("  %c: ", 'a' + i);
            for (int j = 0; j < freq[i] && j < 20; j++)
                printf("#");
            printf(" (%d)\\n", freq[i]);
        }
    }
}

int main() {
    const char *sample =
        "Hello, World! This is a sample text.\\n"
        "It has multiple lines and 123 numbers.\\n"
        "C is a powerful systems programming language.";

    analyze_text(sample);
    return 0;
}

// --- How to modify ---
// - Add word frequency counting with a simple hash table
// - Implement readability scoring (Flesch-Kincaid)
// - Count sentences by detecting period/question/exclamation
// - Add a histogram display with percentage bars`,

  sql: `-- \u{1F6E0}\uFE0F Data Transformation Tool
-- Executed via sql.js (SQLite compiled to WebAssembly).
-- Create tables, transform data, and query results!

-- Create a raw data import table
CREATE TABLE raw_sales (
    date TEXT,
    product TEXT,
    quantity INTEGER,
    unit_price REAL,
    region TEXT
);

-- Insert sample data
INSERT INTO raw_sales VALUES ('2024-01-15', 'Widget A', 10, 29.99, 'North');
INSERT INTO raw_sales VALUES ('2024-01-15', 'Widget B', 5, 49.99, 'South');
INSERT INTO raw_sales VALUES ('2024-01-20', 'Widget A', 8, 29.99, 'East');
INSERT INTO raw_sales VALUES ('2024-02-01', 'Widget C', 15, 19.99, 'North');
INSERT INTO raw_sales VALUES ('2024-02-10', 'Widget B', 12, 49.99, 'West');
INSERT INTO raw_sales VALUES ('2024-02-15', 'Widget A', 20, 29.99, 'South');
INSERT INTO raw_sales VALUES ('2024-03-01', 'Widget C', 7, 19.99, 'East');
INSERT INTO raw_sales VALUES ('2024-03-10', 'Widget A', 3, 29.99, 'North');

-- Monthly summary view
SELECT
    substr(date, 1, 7) AS month,
    product,
    SUM(quantity) AS total_qty,
    ROUND(SUM(quantity * unit_price), 2) AS revenue
FROM raw_sales
GROUP BY month, product
ORDER BY month, revenue DESC;

-- Regional performance
SELECT
    region,
    COUNT(*) AS num_orders,
    SUM(quantity) AS total_units,
    ROUND(SUM(quantity * unit_price), 2) AS total_revenue,
    ROUND(AVG(quantity * unit_price), 2) AS avg_order_value
FROM raw_sales
GROUP BY region
ORDER BY total_revenue DESC;

-- Top products
SELECT product, SUM(quantity) AS sold,
       ROUND(SUM(quantity * unit_price), 2) AS revenue
FROM raw_sales GROUP BY product ORDER BY revenue DESC;

-- --- How to modify ---
-- Add more columns (customer_id, discount, shipping)
-- Create indexes for faster querying on large datasets
-- Add date filtering with WHERE date BETWEEN ... AND ...
-- Build pivot tables with CASE WHEN expressions`,

  ruby: `# \u{1F6E0}\uFE0F JSON Formatter & Validator (Ruby)
# Interpreted via Opal (Ruby-to-JS compiler) in the browser.
# Ruby's elegant syntax makes data manipulation a breeze.

class JsonFormatter
  def initialize(input)
    @input = input
    @indent = 0
    @output = []
  end

  def format
    # Simple JSON pretty printer
    in_string = false
    @input.each_char.with_index do |char, i|
      case char
      when '"'
        @output << char
        # Toggle string mode (skip escaped quotes)
        in_string = !in_string unless i > 0 && @input[i-1] == '\\\\'
      when '{', '['
        unless in_string
          @output << char
          @indent += 1
          @output << "\\n" << ("  " * @indent)
          next
        end
        @output << char
      when '}', ']'
        unless in_string
          @indent -= 1
          @output << "\\n" << ("  " * @indent) << char
          next
        end
        @output << char
      when ','
        unless in_string
          @output << char << "\\n" << ("  " * @indent)
          next
        end
        @output << char
      when ':'
        @output << (in_string ? char : ": ")
      else
        @output << char unless !in_string && char =~ /\\s/
      end
    end
    @output.join
  end

  def stats
    pairs = @input.scan(/"[^"]*"\\s*:/).length
    arrays = @input.count('[')
    objects = @input.count('{')
    depth = max_depth
    { keys: pairs, arrays: arrays, objects: objects, max_depth: depth }
  end

  private

  def max_depth
    depth = 0
    max = 0
    @input.each_char do |c|
      depth += 1 if c == '{' || c == '['
      depth -= 1 if c == '}' || c == ']'
      max = depth if depth > max
    end
    max
  end
end

# Demo
sample = '{"name":"Alice","age":30,"hobbies":["reading","coding"],"address":{"city":"Portland","state":"OR"}}'

formatter = JsonFormatter.new(sample)
puts "=== Formatted JSON ==="
puts formatter.format
puts "\\n=== Statistics ==="
formatter.stats.each { |k, v| puts "  #{k}: #{v}" }

# --- How to modify ---
# - Add JSON validation with error messages and line numbers
# - Implement JSON path queries (e.g., $.address.city)
# - Add minification (reverse of pretty-print)
# - Support YAML output conversion`,
};

// ---------------------------------------------------------------------------
// API CONNECTOR templates
// ---------------------------------------------------------------------------
