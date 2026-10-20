// Widget code templates for the visualizations category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const visualizationTemplates: Record<string, string> = {
  python: `# \u{1F4CA} Data Visualizer (Python)
# Runs via Pyodide in the browser. Full standard library available!
# Creates ASCII charts and data summaries.

import random
from collections import Counter

def bar_chart(data: dict, title: str = "Chart", width: int = 30):
    """Render a horizontal bar chart in the terminal."""
    print(f"\\n  {title}")
    print(f"  {'=' * (width + 20)}")
    max_val = max(data.values())
    for label, value in data.items():
        bar_len = int(value / max_val * width) if max_val > 0 else 0
        bar = "\u2588" * bar_len
        print(f"  {label:>12s} | {bar} {value}")
    print()

def sparkline(data: list, chars: str = "\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588") -> str:
    """Create a sparkline string from numeric data."""
    if not data:
        return ""
    mn, mx = min(data), max(data)
    rng = mx - mn or 1
    return "".join(chars[int((v - mn) / rng * (len(chars) - 1))] for v in data)

def histogram(data: list, bins: int = 10):
    """Display a frequency histogram."""
    mn, mx = min(data), max(data)
    step = (mx - mn) / bins
    counts = Counter()
    for v in data:
        bucket = min(int((v - mn) / step), bins - 1) if step > 0 else 0
        counts[bucket] += 1
    print("  Histogram:")
    max_count = max(counts.values())
    for i in range(bins):
        lo = mn + i * step
        bar = "\u2588" * int(counts.get(i, 0) / max_count * 20)
        print(f"  {lo:6.1f} | {bar} ({counts.get(i, 0)})")

# Generate sample data
print("\u{1F4CA} Data Visualizer")
print("=" * 50)

# Sales by region
sales = {"North": 1200, "South": 890, "East": 1450, "West": 760, "Central": 1100}
bar_chart(sales, "Sales by Region")

# Weekly trend
weekly = [random.randint(50, 200) for _ in range(20)]
print(f"  Weekly trend: {sparkline(weekly)}")
print(f"  Values: {weekly[:10]}...")

# Distribution
samples = [random.gauss(50, 15) for _ in range(100)]
print()
histogram(samples, bins=8)

# --- How to modify ---
# - Add scatter plot using characters on a grid
# - Implement pie chart with percentage labels
# - Add moving average calculation and display
# - Create a real-time data feed simulation`,

  javascript: `// \u{1F4CA} Interactive Charts (JavaScript)
// Runs directly in the browser with Canvas API access.
// Draw bar charts, line charts, and pie charts.

export const output = document.getElementById('output');
export const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 280;
canvas.style.background = '#0d0d1a';
canvas.style.borderRadius = '8px';
canvas.style.border = '1px solid #333';

output.innerHTML = '<h3 style="color:#89b4fa;font-family:system-ui;margin:0 0 8px">\u{1F4CA} Interactive Charts</h3>';
export const btnRow = document.createElement('div');
btnRow.style.cssText = 'display:flex;gap:6px;margin-bottom:8px';

export const colors = ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#74b9ff', '#a29bfe'];
let data = [65, 40, 80, 55, 90, 35, 70];
export const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const ctx = canvas.getContext('2d');

function clear() {
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, 400, 280);
}

function drawBar() {
  clear();
  const max = Math.max(...data);
  const gap = 400 / data.length;
  const barWidth = gap * 0.6;
  data.forEach((v, i) => {
    const h = (v / max) * 220;
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(gap * i + (gap - barWidth) / 2, 250 - h, barWidth, h);
    ctx.fillStyle = '#888';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(labels[i], gap * i + gap / 2, 268);
    ctx.fillText(String(v), gap * i + gap / 2, 245 - h);
  });
}

function drawLine() {
  clear();
  const max = Math.max(...data);
  const gap = 400 / (data.length - 1);
  ctx.strokeStyle = '#6c5ce7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  data.forEach((v, i) => {
    const x = gap * i;
    const y = 250 - (v / max) * 220;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  data.forEach((v, i) => {
    const x = gap * i;
    const y = 250 - (v / max) * 220;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPie() {
  clear();
  const total = data.reduce((a, b) => a + b);
  let angle = 0;
  const cx = 200, cy = 130, r = 100;
  data.forEach((v, i) => {
    const slice = (v / total) * Math.PI * 2;
    ctx.fillStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, angle + slice);
    ctx.fill();
    angle += slice;
  });
}

function randomize() {
  data = data.map(() => Math.floor(Math.random() * 80 + 20));
  drawBar();
}

['Bar', 'Line', 'Pie', 'Randomize'].forEach(type => {
  const btn = document.createElement('button');
  btn.textContent = type;
  btn.style.cssText = 'padding:6px 14px;background:#6c5ce7;color:#fff;border:none;border-radius:6px;cursor:pointer;font-size:12px';
  btn.onclick = type === 'Randomize' ? randomize :
    type === 'Bar' ? drawBar : type === 'Line' ? drawLine : drawPie;
  btnRow.appendChild(btn);
});

output.appendChild(btnRow);
output.appendChild(canvas);
drawBar();

// --- How to modify ---
// - Add axis labels and grid lines
// - Implement hover tooltips showing values
// - Add stacked bar charts with multiple datasets
// - Create animated transitions between chart types`,

  typescript: `// \u{1F4CA} Dashboard Builder (TypeScript)
// Transpiled and run in the browser with type checking.
// Creates a data dashboard with typed components.

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface StatCard {
  title: string;
  value: string;
  change: number;
  icon: string;
}

function renderStat(stat: StatCard): string {
  const changeColor = stat.change >= 0 ? '#a6e3a1' : '#f38ba8';
  const arrow = stat.change >= 0 ? '\u25B2' : '\u25BC';
  return \`<div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;min-width:120px">
    <div style="font-size:20px">\${stat.icon}</div>
    <div style="font-size:22px;font-weight:bold;color:#e6edf3;margin:4px 0">\${stat.value}</div>
    <div style="font-size:12px;color:#8b949e">\${stat.title}</div>
    <div style="font-size:11px;color:\${changeColor}">\${arrow} \${Math.abs(stat.change)}%</div>
  </div>\`;
}

function renderBarChart(data: DataPoint[], maxWidth: number = 200): string {
  const max = Math.max(...data.map(d => d.value));
  return data.map(d => {
    const width = (d.value / max) * maxWidth;
    const color = d.color || '#6c5ce7';
    return \`<div style="display:flex;align-items:center;gap:8px;margin:4px 0">
      <span style="width:60px;font-size:12px;text-align:right;color:#8b949e">\${d.label}</span>
      <div style="background:\${color};height:20px;width:\${width}px;border-radius:3px"></div>
      <span style="font-size:12px;color:#e6edf3">\${d.value}</span>
    </div>\`;
  }).join('');
}

// Dashboard data
export const stats: StatCard[] = [
  { title: 'Users', value: '12,847', change: 12.5, icon: '\u{1F465}' },
  { title: 'Revenue', value: '$48.2K', change: 8.3, icon: '\u{1F4B0}' },
  { title: 'Orders', value: '1,429', change: -2.1, icon: '\u{1F4E6}' },
  { title: 'Conversion', value: '3.2%', change: 0.8, icon: '\u{1F4C8}' },
];

export const traffic: DataPoint[] = [
  { label: 'Direct', value: 4200, color: '#6c5ce7' },
  { label: 'Search', value: 3100, color: '#00b894' },
  { label: 'Social', value: 2400, color: '#fdcb6e' },
  { label: 'Referral', value: 1800, color: '#e17055' },
  { label: 'Email', value: 900, color: '#74b9ff' },
];

export const output = document.getElementById('output')!;
output.innerHTML = \`
  <div style="font-family:system-ui;padding:4px">
    <h3 style="color:#58a6ff;margin:0 0 12px">\u{1F4CA} Dashboard</h3>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
      \${stats.map(renderStat).join('')}
    </div>
    <h4 style="color:#8b949e;margin:0 0 8px">Traffic Sources</h4>
    \${renderBarChart(traffic)}
  </div>
\`;

// --- How to modify ---
// - Add a line chart component with SVG
// - Implement real-time data updates with setInterval
// - Add click handlers for drill-down views
// - Create responsive layout with CSS Grid`,

  c: `// \u{1F4CA} ASCII Chart Renderer (C)
// Runs via JSCPP interpreter in the browser.
// Renders bar charts and data tables in pure ASCII.

#include <stdio.h>
#include <string.h>

void bar_chart(const char *labels[], int values[], int count, int max_width) {
    int max_val = 0;
    for (int i = 0; i < count; i++) {
        if (values[i] > max_val) max_val = values[i];
    }

    printf("\\n");
    for (int i = 0; i < count; i++) {
        int bar_len = (values[i] * max_width) / (max_val > 0 ? max_val : 1);
        printf("  %8s | ", labels[i]);
        for (int j = 0; j < bar_len; j++) printf("#");
        printf(" %d\\n", values[i]);
    }
    printf("  %8s +", "");
    for (int i = 0; i < max_width + 2; i++) printf("-");
    printf("\\n");
}

void summary_stats(int data[], int count) {
    int sum = 0, min_val = data[0], max_val = data[0];
    for (int i = 0; i < count; i++) {
        sum += data[i];
        if (data[i] < min_val) min_val = data[i];
        if (data[i] > max_val) max_val = data[i];
    }
    float avg = (float)sum / count;

    printf("\\n  Summary Statistics:\\n");
    printf("  Count:   %d\\n", count);
    printf("  Sum:     %d\\n", sum);
    printf("  Average: %.1f\\n", avg);
    printf("  Min:     %d\\n", min_val);
    printf("  Max:     %d\\n", max_val);
    printf("  Range:   %d\\n", max_val - min_val);
}

int main() {
    printf("=== ASCII Chart Renderer ===\\n");

    const char *months[] = {"Jan", "Feb", "Mar", "Apr", "May", "Jun"};
    int sales[] = {120, 85, 150, 95, 180, 140};

    printf("\\n  Monthly Sales:");
    bar_chart(months, sales, 6, 25);

    summary_stats(sales, 6);

    printf("\\n  Comparison:\\n");
    const char *products[] = {"Widget A", "Widget B", "Widget C"};
    int units[] = {340, 210, 425};
    bar_chart(products, units, 3, 30);

    return 0;
}

// --- How to modify ---
// - Add vertical bar chart rendering
// - Implement a simple line chart using characters
// - Add percentage calculations and pie chart
// - Create a two-dataset grouped bar chart`,

  sql: `-- \u{1F4CA} Data Analytics Dashboard (SQL)
-- Executed via sql.js (SQLite compiled to WebAssembly).
-- Build analytics queries on sample data.

CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    event_type TEXT,
    user_id INTEGER,
    value REAL,
    created_at TEXT
);

-- Generate sample event data
INSERT INTO events VALUES (1, 'pageview', 1, 1, '2024-01-15 10:00');
INSERT INTO events VALUES (2, 'click', 1, 1, '2024-01-15 10:05');
INSERT INTO events VALUES (3, 'purchase', 1, 49.99, '2024-01-15 10:10');
INSERT INTO events VALUES (4, 'pageview', 2, 1, '2024-01-15 11:00');
INSERT INTO events VALUES (5, 'pageview', 3, 1, '2024-01-16 09:00');
INSERT INTO events VALUES (6, 'click', 3, 1, '2024-01-16 09:05');
INSERT INTO events VALUES (7, 'purchase', 2, 29.99, '2024-01-16 14:00');
INSERT INTO events VALUES (8, 'pageview', 4, 1, '2024-01-17 08:00');
INSERT INTO events VALUES (9, 'purchase', 4, 99.99, '2024-01-17 08:30');
INSERT INTO events VALUES (10, 'pageview', 5, 1, '2024-01-17 12:00');

-- Event funnel analysis
SELECT
    event_type,
    COUNT(*) AS count,
    COUNT(DISTINCT user_id) AS unique_users,
    ROUND(COALESCE(SUM(CASE WHEN event_type = 'purchase' THEN value END), COUNT(*)), 2) AS total_value
FROM events
GROUP BY event_type
ORDER BY count DESC;

-- Daily metrics
SELECT
    substr(created_at, 1, 10) AS date,
    COUNT(*) AS total_events,
    COUNT(DISTINCT user_id) AS active_users,
    SUM(CASE WHEN event_type = 'purchase' THEN value ELSE 0 END) AS revenue
FROM events
GROUP BY date
ORDER BY date;

-- Conversion funnel
SELECT
    (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type = 'pageview') AS viewers,
    (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type = 'click') AS clickers,
    (SELECT COUNT(DISTINCT user_id) FROM events WHERE event_type = 'purchase') AS buyers;

-- --- How to modify ---
-- Add cohort analysis with user signup dates
-- Implement retention metrics (day 1, day 7, day 30)
-- Add moving averages with window functions
-- Create A/B test analysis with GROUP BY variant`,

  ruby: `# \u{1F4CA} Data Pipeline (Ruby)
# Interpreted via Opal (Ruby-to-JS compiler) in the browser.
# Process, transform, and visualize data with Ruby's Enumerable.

module DataPipeline
  def self.histogram(data, width: 30)
    min, max = data.minmax
    range = max - min
    bins = 8
    step = range.to_f / bins
    counts = Array.new(bins, 0)

    data.each do |v|
      idx = [(((v - min) / step).floor), bins - 1].min
      counts[idx] += 1
    end

    max_count = counts.max
    puts "  Distribution:"
    bins.times do |i|
      lo = (min + i * step).round(1)
      bar = "\u2588" * (counts[i].to_f / max_count * width).round
      puts "  #{lo.to_s.rjust(6)} |#{bar} (#{counts[i]})"
    end
  end

  def self.summary(data, label: "Data")
    sorted = data.sort
    n = sorted.length
    mean = sorted.sum.to_f / n
    median = n.odd? ? sorted[n/2] : (sorted[n/2-1] + sorted[n/2]) / 2.0
    variance = sorted.map { |v| (v - mean) ** 2 }.sum / n
    stddev = Math.sqrt(variance)

    puts "  #{label} Summary (n=#{n}):"
    puts "    Mean:   #{mean.round(2)}"
    puts "    Median: #{median.round(2)}"
    puts "    StdDev: #{stddev.round(2)}"
    puts "    Range:  #{sorted.first} - #{sorted.last}"
    puts
  end
end

puts "\u{1F4CA} Data Pipeline"
puts "=" * 40

# Generate sample data
scores = (1..50).map { |_| rand(40..100) }
prices = (1..30).map { |_| (rand * 100 + 10).round(2) }

DataPipeline.summary(scores, label: "Test Scores")
DataPipeline.histogram(scores)
puts
DataPipeline.summary(prices, label: "Product Prices")
DataPipeline.histogram(prices)

# Top/bottom analysis
sorted = scores.sort.reverse
puts "\\n  Top 5 scores: #{sorted.first(5).join(', ')}"
puts "  Bottom 5:     #{sorted.last(5).join(', ')}"

# --- How to modify ---
# - Add percentile calculations (p25, p50, p75, p99)
# - Implement correlation between two datasets
# - Create a time series analysis with moving averages
# - Add outlier detection with IQR method`,
};

// ---------------------------------------------------------------------------
// SOCIAL templates
// ---------------------------------------------------------------------------
