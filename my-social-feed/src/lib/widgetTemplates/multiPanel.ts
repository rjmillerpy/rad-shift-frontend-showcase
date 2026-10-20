// Widget code templates for the multiPanel category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

import type { WidgetTemplate } from './types';

export const MULTI_PANEL_TEMPLATES: Record<string, Omit<WidgetTemplate, "name" | "emoji" | "description">> = {
  game: {
    html: '<canvas id="canvas" width="400" height="300"></canvas>\n<div id="score">Score: 0</div>',
    css: 'body { margin: 0; background: #111; }\ncanvas { display: block; border: 1px solid #333; }\n#score { color: #0f0; font-family: monospace; padding: 8px; }',
    js: `const canvas = document.getElementById("canvas");\nconst ctx = canvas.getContext("2d");\nlet score = 0;\n\nfunction draw() {\n  ctx.fillStyle = "#111";\n  ctx.fillRect(0, 0, canvas.width, canvas.height);\n  ctx.fillStyle = "#0f0";\n  ctx.font = "16px monospace";\n  ctx.fillText("Click canvas to start!", 100, 150);\n}\n\ncanvas.addEventListener("click", () => {\n  score++;\n  document.getElementById("score").textContent = "Score: " + score;\n  draw();\n});\n\ndraw();`,
  },
  tool: {
    html: '<div id="app">\n  <h1>Utility Tool</h1>\n  <input id="input" type="text" placeholder="Enter text..." />\n  <button id="btn">Process</button>\n  <div id="output"></div>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\ninput { padding: 8px 12px; border: 1px solid #333; border-radius: 4px; background: #2a2a2a; color: #fff; margin-right: 8px; }\nbutton { background: #0e639c; color: #fff; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }\n#output { margin-top: 12px; padding: 12px; background: #252530; border-radius: 6px; min-height: 40px; }',
    js: `document.getElementById("btn").addEventListener("click", () => {\n  const val = document.getElementById("input").value;\n  document.getElementById("output").textContent = "Processed: " + val.toUpperCase();\n});`,
  },
  api_connector: {
    html: '<div id="app">\n  <h2>API Connector</h2>\n  <input id="url" type="text" value="https://jsonplaceholder.typicode.com/todos/1" />\n  <button id="fetch-btn">Fetch</button>\n  <pre id="result">Click Fetch to load data...</pre>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\ninput { width: 80%; padding: 8px; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: #fff; }\nbutton { margin-left: 8px; padding: 8px 16px; background: #0e639c; color: #fff; border: none; border-radius: 4px; cursor: pointer; }\npre { background: #252530; padding: 12px; border-radius: 6px; overflow-x: auto; white-space: pre-wrap; }',
    js: `document.getElementById("fetch-btn").addEventListener("click", async () => {\n  const url = document.getElementById("url").value;\n  const el = document.getElementById("result");\n  el.textContent = "Loading...";\n  try {\n    const res = await fetch(url);\n    const data = await res.json();\n    el.textContent = JSON.stringify(data, null, 2);\n  } catch (err) {\n    el.textContent = "Error: " + err.message;\n  }\n});`,
    compute: 'import requests\nimport json\n\nresponse = requests.get("https://jsonplaceholder.typicode.com/todos/1")\ndata = response.json()\nprint(json.dumps(data, indent=2))',
    computeLanguage: "python",
  },
  display_modifier: {
    html: '<div id="app">\n  <h2>Display Modifier</h2>\n  <div id="target">Style me!</div>\n  <div class="controls">\n    <button onclick="setTheme(\'neon\')">Neon</button>\n    <button onclick="setTheme(\'pastel\')">Pastel</button>\n    <button onclick="setTheme(\'dark\')">Dark</button>\n  </div>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\n#target { padding: 24px; text-align: center; font-size: 24px; border-radius: 8px; margin: 16px 0; transition: all 0.3s ease; background: #333; }\n.controls { display: flex; gap: 8px; }\nbutton { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; background: #444; color: #fff; }',
    js: `function setTheme(theme) {\n  const el = document.getElementById("target");\n  const themes = {\n    neon: { background: "#0a0a0a", color: "#0ff", boxShadow: "0 0 20px #0ff" },\n    pastel: { background: "#fce4ec", color: "#880e4f", boxShadow: "none" },\n    dark: { background: "#1a1a2e", color: "#e0e0e0", boxShadow: "0 2px 8px rgba(0,0,0,0.5)" },\n  };\n  Object.assign(el.style, themes[theme] || {});\n}`,
  },
  lambda: {
    html: '<div id="app">\n  <h2>Lambda Function</h2>\n  <textarea id="input" rows="4">{\"name\": \"World\"}</textarea>\n  <button id="run">Execute</button>\n  <pre id="result"></pre>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\ntextarea { width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: #fff; font-family: monospace; box-sizing: border-box; }\nbutton { margin-top: 8px; padding: 8px 16px; background: #0e639c; color: #fff; border: none; border-radius: 4px; cursor: pointer; }\npre { background: #252530; padding: 12px; border-radius: 6px; margin-top: 12px; white-space: pre-wrap; }',
    js: `document.getElementById("run").onclick = async () => {\n  const input = document.getElementById("input").value;\n  const el = document.getElementById("result");\n  el.textContent = "Executing...";\n  try {\n    const res = await fetch("/widgets/execute", {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ code: "handler", language: "python", input_data: input }),\n    });\n    el.textContent = JSON.stringify(await res.json(), null, 2);\n  } catch (err) {\n    el.textContent = "Error: " + err.message;\n  }\n};`,
    compute: 'import json\n\ndef handler(event):\n    name = event.get("name", "World")\n    return {"message": f"Hello, {name}!", "status": 200}\n\nresult = handler(json.loads(input_data))\nprint(json.dumps(result))',
    computeLanguage: "python",
  },
  visualization: {
    html: '<div id="app">\n  <h2>Data Visualization</h2>\n  <canvas id="chart" width="400" height="250"></canvas>\n  <div id="legend"></div>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\ncanvas { border: 1px solid #333; border-radius: 4px; background: #0d0d15; }\n#legend { margin-top: 8px; font-size: 12px; color: #888; }',
    js: `const canvas = document.getElementById("chart");\nconst ctx = canvas.getContext("2d");\nconst data = [40, 70, 55, 90, 35, 65, 80];\nconst labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];\nconst barW = 40, gap = 12, offsetX = 30, maxH = 200;\n\nctx.fillStyle = "#333";\nctx.fillRect(0, 0, canvas.width, canvas.height);\n\ndata.forEach((v, i) => {\n  const h = (v / 100) * maxH;\n  const x = offsetX + i * (barW + gap);\n  const y = canvas.height - h - 30;\n  ctx.fillStyle = "hsl(" + (i * 45) + ", 70%, 55%)";\n  ctx.fillRect(x, y, barW, h);\n  ctx.fillStyle = "#aaa";\n  ctx.font = "11px sans-serif";\n  ctx.fillText(labels[i], x + 8, canvas.height - 12);\n});`,
  },
  social: {
    html: '<div id="app">\n  <h2>Social Widget</h2>\n  <div id="feed"></div>\n  <div class="compose">\n    <input id="msg" type="text" placeholder="Write a message..." />\n    <button id="send">Send</button>\n  </div>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\n#feed { min-height: 120px; background: #252530; border-radius: 6px; padding: 12px; margin-bottom: 12px; }\n.compose { display: flex; gap: 8px; }\ninput { flex: 1; padding: 8px 12px; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: #fff; }\nbutton { padding: 8px 16px; background: #0e639c; color: #fff; border: none; border-radius: 4px; cursor: pointer; }\n.post { padding: 8px 0; border-bottom: 1px solid #333; font-size: 14px; }',
    js: `const feed = document.getElementById("feed");\nconst input = document.getElementById("msg");\n\ndocument.getElementById("send").addEventListener("click", () => {\n  const text = input.value.trim();\n  if (!text) return;\n  const div = document.createElement("div");\n  div.className = "post";\n  div.textContent = new Date().toLocaleTimeString() + " - " + text;\n  feed.prepend(div);\n  input.value = "";\n});\n\ninput.addEventListener("keydown", (e) => {\n  if (e.key === "Enter") document.getElementById("send").click();\n});`,
  },
  db_connector: {
    html: '<div id="app">\n  <h2>Database Query</h2>\n  <textarea id="query" rows="3">SELECT * FROM users LIMIT 10;</textarea>\n  <button id="run-query">Run Query</button>\n  <pre id="results">Enter a SQL query and click Run.</pre>\n</div>',
    css: 'body { font-family: sans-serif; padding: 16px; background: #1e1e1e; color: #d4d4d4; }\ntextarea { width: 100%; padding: 8px; background: #2a2a2a; border: 1px solid #333; border-radius: 4px; color: #fff; font-family: monospace; box-sizing: border-box; }\nbutton { margin-top: 8px; padding: 8px 16px; background: #0e639c; color: #fff; border: none; border-radius: 4px; cursor: pointer; }\npre { background: #252530; padding: 12px; border-radius: 6px; margin-top: 12px; white-space: pre-wrap; overflow-x: auto; }',
    js: `document.getElementById("run-query").addEventListener("click", async () => {\n  const query = document.getElementById("query").value;\n  const el = document.getElementById("results");\n  el.textContent = "Running...";\n  try {\n    const res = await fetch("/widgets/execute", {\n      method: "POST",\n      headers: { "Content-Type": "application/json" },\n      body: JSON.stringify({ code: query, language: "sql" }),\n    });\n    const data = await res.json();\n    el.textContent = JSON.stringify(data.results || data, null, 2);\n  } catch (err) {\n    el.textContent = "Error: " + err.message;\n  }\n});`,
    compute: 'CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);\nINSERT INTO users (name, email) VALUES (\'Alice\', \'alice@example.com\');\nINSERT INTO users (name, email) VALUES (\'Bob\', \'bob@example.com\');\nSELECT * FROM users;',
    computeLanguage: "sql",
  },
};
