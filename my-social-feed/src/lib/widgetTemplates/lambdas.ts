// Widget code templates for the lambdas category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const lambdaTemplates: Record<string, string> = {
  python: `# \u{26A1} Lambda Function Handler (Python)
# Runs via Pyodide in the browser.
# This is an AWS Lambda-style handler. Modify handler() with your logic.

import json
from datetime import datetime
from typing import Any, Dict, Optional

def handler(event: Dict[str, Any], context: Optional[Dict] = None) -> Dict[str, Any]:
    """Process the incoming event and return a response."""
    name = event.get("name", "World")
    count = event.get("count", 1)
    action = event.get("action", "greet")

    if action == "greet":
        results = [f"Hello, {name}! (#{i+1})" for i in range(count)]
    elif action == "reverse":
        results = [name[::-1]]
    elif action == "stats":
        results = [
            f"Length: {len(name)}",
            f"Uppercase: {name.upper()}",
            f"Words: {len(name.split())}",
        ]
    else:
        results = [f"Unknown action: {action}"]

    return {
        "statusCode": 200,
        "body": results,
        "processed_at": datetime.now().isoformat(),
        "event_keys": list(event.keys()),
    }

# Test invocations
test_events = [
    {"name": "RadShift", "count": 3, "action": "greet"},
    {"name": "Hello World", "action": "reverse"},
    {"name": "Lambda Functions Are Cool", "action": "stats"},
]

print("\u{26A1} Lambda Function Handler")
print("=" * 40)
for i, event in enumerate(test_events):
    print(f"\\nInvocation #{i+1}:")
    print(f"  Event: {json.dumps(event)}")
    response = handler(event)
    print(f"  Response: {json.dumps(response, indent=2)}")

# --- How to modify ---
# - Add input validation with custom error responses
# - Implement middleware pattern (logging, auth, timing)
# - Add different routes based on event["path"]
# - Create a DynamoDB-style in-memory data store`,

  javascript: `// \u{26A1} Lambda Function Handler (JavaScript)
// Runs directly in the browser. Full DOM access available.
// Simulates an AWS Lambda execution environment.

export const output = document.getElementById('output');

// Lambda handler function
async function handler(event, context) {
  const startTime = Date.now();

  // Route based on httpMethod and path
  const method = event.httpMethod || 'GET';
  const path = event.path || '/';
  const body = event.body ? JSON.parse(event.body) : {};

  let response;

  switch (\`\${method} \${path}\`) {
    case 'GET /':
      response = { message: 'Lambda is running!', timestamp: new Date().toISOString() };
      break;
    case 'GET /users':
      response = { users: [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }] };
      break;
    case 'POST /echo':
      response = { echo: body, received_at: new Date().toISOString() };
      break;
    default:
      return { statusCode: 404, body: JSON.stringify({ error: \`Route not found: \${method} \${path}\` }) };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(response),
    duration: Date.now() - startTime,
  };
}

// Simulate invocations
export const events = [
  { httpMethod: 'GET', path: '/' },
  { httpMethod: 'GET', path: '/users' },
  { httpMethod: 'POST', path: '/echo', body: JSON.stringify({ message: 'Hello!' }) },
  { httpMethod: 'GET', path: '/unknown' },
];

output.innerHTML = '<h3 style="color:#89b4fa;font-family:system-ui">\u{26A1} Lambda Simulator</h3>';

(async () => {
  const context = {
    functionName: 'myLambda',
    requestId: crypto.randomUUID?.() ?? Math.random().toString(36).slice(2),
  };

  for (const event of events) {
    const result = await handler(event, context);
    const color = result.statusCode === 200 ? '#a6e3a1' : '#f38ba8';
    output.innerHTML += \`<div style="font-family:monospace;margin:8px 0;padding:8px;background:#16213e;border-radius:6px">
      <span style="color:\${color}">\${result.statusCode}</span>
      <span style="color:#888"> \${event.httpMethod} \${event.path}</span>
      <span style="color:#666;margin-left:8px">\${result.duration || 0}ms</span>
      <pre style="margin:4px 0 0;font-size:11px;color:#ccc">\${result.body}</pre>
    </div>\`;
  }
})();

// --- How to modify ---
// - Add middleware (CORS headers, auth checking, logging)
// - Implement path parameters (/users/:id)
// - Add request validation with JSON schema
// - Create a warm/cold start simulation`,

  typescript: `// \u{26A1} Lambda Function Handler (TypeScript)
// Transpiled and run in the browser with type checking.
// Fully typed Lambda handler with event/context interfaces.

interface LambdaEvent {
  httpMethod: string;
  path: string;
  queryStringParameters?: Record<string, string>;
  body?: string;
  headers?: Record<string, string>;
}

interface LambdaContext {
  functionName: string;
  requestId: string;
  memoryLimitInMB: number;
  getRemainingTimeInMillis: () => number;
}

interface LambdaResponse {
  statusCode: number;
  headers?: Record<string, string>;
  body: string;
}

type RouteHandler = (event: LambdaEvent) => Promise<unknown>;

class LambdaRouter {
  private routes: Map<string, RouteHandler> = new Map();

  route(method: string, path: string, handler: RouteHandler): void {
    this.routes.set(\`\${method} \${path}\`, handler);
  }

  async handle(event: LambdaEvent): Promise<LambdaResponse> {
    const key = \`\${event.httpMethod} \${event.path}\`;
    const handler = this.routes.get(key);

    if (!handler) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Not Found' }) };
    }

    try {
      const result = await handler(event);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    } catch (err: unknown) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: String(err) }),
      };
    }
  }
}

// Set up routes
export const router = new LambdaRouter();

router.route('GET', '/health', async () => ({
  status: 'healthy', uptime: performance.now().toFixed(0) + 'ms',
}));

router.route('GET', '/users', async () => ({
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
  ],
}));

router.route('POST', '/transform', async (event) => {
  const body = JSON.parse(event.body || '{}');
  return { original: body.text, upper: body.text?.toUpperCase(), length: body.text?.length };
});

// Simulate invocations
export const events: LambdaEvent[] = [
  { httpMethod: 'GET', path: '/health' },
  { httpMethod: 'GET', path: '/users' },
  { httpMethod: 'POST', path: '/transform', body: '{"text":"hello typescript"}' },
];

export const output = document.getElementById('output')!;
output.innerHTML = '<h3 style="color:#58a6ff;font-family:system-ui">\u{26A1} TypeScript Lambda</h3>';

(async () => {
  for (const event of events) {
    const response = await router.handle(event);
    output.innerHTML += \`<pre style="background:#161b22;padding:8px;border-radius:6px;font-size:11px;margin:4px 0">
\${event.httpMethod} \${event.path} => \${response.statusCode}
\${JSON.stringify(JSON.parse(response.body), null, 2)}</pre>\`;
  }
})();

// --- How to modify ---
// - Add path parameter extraction (/users/:id)
// - Implement request body validation
// - Add rate limiting middleware
// - Create typed error classes for different HTTP errors`,

  golang: `// \u{26A1} Lambda Function Handler (Go)
// The Go interpreter supports: fmt, strings, strconv, math packages.
// Demonstrates a Go-style serverless handler with typed structs.

package main

import "fmt"

type Event struct {
	Action string
	Name   string
	Count  int
}

type Response struct {
	StatusCode int
	Body       string
	Headers    map[string]string
}

func handler(event Event) Response {
	var body string

	switch event.Action {
	case "greet":
		body = fmt.Sprintf("{\"message\": \"Hello, %s!\"}", event.Name)
	case "repeat":
		result := ""
		for i := 0; i < event.Count; i++ {
			if i > 0 {
				result += ", "
			}
			result += fmt.Sprintf("%s #%d", event.Name, i+1)
		}
		body = fmt.Sprintf("{\"results\": \"%s\"}", result)
	case "stats":
		body = fmt.Sprintf("{\"name\": \"%s\", \"length\": %d, \"action\": \"%s\"}",
			event.Name, len(event.Name), event.Action)
	default:
		return Response{
			StatusCode: 400,
			Body:       fmt.Sprintf("{\"error\": \"Unknown action: %s\"}", event.Action),
			Headers:    map[string]string{"Content-Type": "application/json"},
		}
	}

	return Response{
		StatusCode: 200,
		Body:       body,
		Headers:    map[string]string{"Content-Type": "application/json"},
	}
}

func main() {
	fmt.Println("=== Go Lambda Handler ===")
	fmt.Println()

	events := []Event{
		{Action: "greet", Name: "RadShift"},
		{Action: "repeat", Name: "Go", Count: 5},
		{Action: "stats", Name: "Serverless Functions"},
		{Action: "unknown", Name: "test"},
	}

	for i, event := range events {
		resp := handler(event)
		status := "OK"
		if resp.StatusCode != 200 {
			status = "ERROR"
		}
		fmt.Printf("Invocation #%d [%s %d]:\\n", i+1, status, resp.StatusCode)
		fmt.Printf("  Event:    {action: %s, name: %s}\\n", event.Action, event.Name)
		fmt.Printf("  Response: %s\\n\\n", resp.Body)
	}
}

// --- How to modify ---
// - Add context struct with timeout and request ID
// - Implement middleware chain with function composition
// - Add JSON marshaling/unmarshaling helpers
// - Create an in-memory key-value store for state`,

  rust: `// \u{26A1} Lambda Function Handler (Rust)
// Compiled to WebAssembly and executed in the browser.
// Demonstrates Rust's strong typing for serverless handlers.

use std::collections::HashMap;

#[derive(Debug)]
struct Event {
    action: String,
    payload: HashMap<String, String>,
}

#[derive(Debug)]
struct Response {
    status_code: u16,
    body: String,
    headers: HashMap<String, String>,
}

impl Response {
    fn ok(body: String) -> Self {
        let mut headers = HashMap::new();
        headers.insert("Content-Type".to_string(), "application/json".to_string());
        Response { status_code: 200, body, headers }
    }

    fn error(code: u16, message: &str) -> Self {
        Response::ok(format!("{{\"error\": \"{}\"}}", message))
            .with_status(code)
    }

    fn with_status(mut self, code: u16) -> Self {
        self.status_code = code;
        self
    }
}

fn handler(event: &Event) -> Response {
    match event.action.as_str() {
        "greet" => {
            let name = event.payload.get("name")
                .map(|s| s.as_str())
                .unwrap_or("World");
            Response::ok(format!("{{\"message\": \"Hello, {}!\"}}", name))
        }
        "reverse" => {
            let text = event.payload.get("text")
                .map(|s| s.as_str())
                .unwrap_or("");
            let reversed: String = text.chars().rev().collect();
            Response::ok(format!("{{\"result\": \"{}\"}}", reversed))
        }
        "count" => {
            let text = event.payload.get("text")
                .map(|s| s.as_str())
                .unwrap_or("");
            let words = text.split_whitespace().count();
            let chars = text.len();
            Response::ok(format!(
                "{{\"chars\": {}, \"words\": {}}}", chars, words
            ))
        }
        _ => Response::error(400, &format!("Unknown action: {}", event.action)),
    }
}

fn main() {
    println!("=== Rust Lambda Handler ===\\n");

    let events = vec![
        Event {
            action: "greet".to_string(),
            payload: [("name".to_string(), "RadShift".to_string())].into(),
        },
        Event {
            action: "reverse".to_string(),
            payload: [("text".to_string(), "Hello Rust".to_string())].into(),
        },
        Event {
            action: "count".to_string(),
            payload: [("text".to_string(), "Serverless functions in Rust".to_string())].into(),
        },
    ];

    for (i, event) in events.iter().enumerate() {
        let response = handler(event);
        println!("Invocation #{}: [{}]", i + 1, response.status_code);
        println!("  Event:    {:?}", event.action);
        println!("  Response: {}", response.body);
        println!();
    }
}

// --- How to modify ---
// - Add serde-style JSON serialization traits
// - Implement Result<Response, LambdaError> return types
// - Add async handler simulation with closures
// - Create a macro for route definitions`,

  c: `// \u{26A1} Lambda Function Handler (C)
// Runs via JSCPP interpreter in the browser.
// Demonstrates a C-style event handler with structs.

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

typedef struct {
    char action[32];
    char name[64];
    int count;
} Event;

typedef struct {
    int status_code;
    char body[512];
} Response;

Response handler(Event event) {
    Response resp;
    resp.status_code = 200;

    if (strcmp(event.action, "greet") == 0) {
        sprintf(resp.body, "{\"message\": \"Hello, %s!\"}", event.name);
    } else if (strcmp(event.action, "repeat") == 0) {
        char temp[256] = "";
        for (int i = 0; i < event.count && i < 10; i++) {
            char part[32];
            sprintf(part, "%s%s #%d", i > 0 ? ", " : "", event.name, i + 1);
            strcat(temp, part);
        }
        sprintf(resp.body, "{\"results\": \"%s\"}", temp);
    } else if (strcmp(event.action, "length") == 0) {
        sprintf(resp.body, "{\"name\": \"%s\", \"length\": %d}",
                event.name, (int)strlen(event.name));
    } else {
        resp.status_code = 400;
        sprintf(resp.body, "{\"error\": \"Unknown action: %s\"}", event.action);
    }

    return resp;
}

int main() {
    printf("=== C Lambda Handler ===\\n\\n");

    Event events[] = {
        {"greet", "RadShift", 0},
        {"repeat", "C", 5},
        {"length", "Serverless in C", 0},
        {"unknown", "test", 0},
    };
    int num_events = 4;

    for (int i = 0; i < num_events; i++) {
        Response resp = handler(events[i]);
        printf("Invocation #%d [%d]:\\n", i + 1, resp.status_code);
        printf("  Action:   %s\\n", events[i].action);
        printf("  Response: %s\\n\\n", resp.body);
    }

    return 0;
}

// --- How to modify ---
// - Add more actions (uppercase, word count, etc.)
// - Implement a context struct with function metadata
// - Add error handling with return codes
// - Create a simple JSON parser for event bodies`,
};

// ---------------------------------------------------------------------------
// DB CONNECTOR templates
// ---------------------------------------------------------------------------
