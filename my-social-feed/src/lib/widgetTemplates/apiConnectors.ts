// Widget code templates for the apiConnectors category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const apiConnectorTemplates: Record<string, string> = {
  python: `# \u{1F310} REST API Client (Python)
# Runs via Pyodide in the browser with full standard library.
# Uses urllib for HTTP requests (requests not available in Pyodide).

import json
from urllib.request import urlopen, Request
from urllib.parse import urlencode
from dataclasses import dataclass, asdict
from typing import List, Optional

@dataclass
class ApiResponse:
    status: int
    data: dict
    endpoint: str

class RestClient:
    """A simple REST API client."""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")
        self.headers = {"Accept": "application/json"}

    def get(self, path: str, params: Optional[dict] = None) -> ApiResponse:
        url = f"{self.base_url}/{path}"
        if params:
            url += "?" + urlencode(params)
        req = Request(url, headers=self.headers)
        with urlopen(req) as resp:
            data = json.loads(resp.read())
            return ApiResponse(status=resp.status, data=data, endpoint=path)

    def display(self, response: ApiResponse):
        print(f"GET /{response.endpoint} -> {response.status}")
        print(json.dumps(response.data, indent=2)[:500])
        print()

# Demo: Query JSONPlaceholder API
client = RestClient("https://jsonplaceholder.typicode.com")

print("\u{1F310} API Explorer")
print("=" * 40)

# Fetch users
resp = client.get("users", {"_limit": "3"})
client.display(resp)

# Fetch a single post
resp = client.get("posts/1")
client.display(resp)

# --- How to modify ---
# - Add POST/PUT/DELETE methods to the RestClient class
# - Implement response caching with a dictionary
# - Add retry logic with exponential backoff
# - Create typed response models with dataclasses`,

  javascript: `// \u{1F310} API Explorer
// Runs directly in the browser with full fetch() access.
// Explore any public REST API interactively.

export const container = document.getElementById('output');
container.innerHTML = \`
  <div style="font-family:system-ui;padding:4px">
    <h3 style="color:#89b4fa;margin:0 0 12px">\u{1F310} API Explorer</h3>
    <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">
      <select id="method" style="background:#0d0d1a;color:#e0e0e0;border:1px solid #333;border-radius:6px;padding:8px">
        <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
      </select>
      <input id="url" value="https://jsonplaceholder.typicode.com/posts/1"
        style="flex:1;min-width:200px;background:#0d0d1a;color:#e0e0e0;border:1px solid #333;border-radius:6px;padding:8px;font-size:14px">
      <button onclick="sendRequest()" style="background:#6c5ce7;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer">
        Send
      </button>
    </div>
    <div id="status" style="font-size:13px;color:#888;margin-bottom:8px"></div>
    <pre id="response" style="background:#0d0d1a;border:1px solid #333;border-radius:6px;padding:12px;
      font-size:12px;font-family:monospace;overflow:auto;max-height:300px;white-space:pre-wrap">
Click Send to fetch data...</pre>
  </div>
\`;

async function sendRequest() {
  const url = document.getElementById('url').value;
  const method = document.getElementById('method').value;
  const statusEl = document.getElementById('status');
  const responseEl = document.getElementById('response');

  statusEl.textContent = 'Loading...';
  const start = performance.now();

  try {
    const response = await fetch(url, { method });
    const elapsed = (performance.now() - start).toFixed(0);
    const data = await response.json();

    const color = response.ok ? '#a6e3a1' : '#f38ba8';
    statusEl.innerHTML = \`<span style="color:\${color}">\${response.status} \${response.statusText}</span>
      <span style="color:#888;margin-left:12px">\${elapsed}ms</span>\`;
    responseEl.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    statusEl.innerHTML = '<span style="color:#f38ba8">Error</span>';
    responseEl.textContent = err.message;
  }
}

// --- How to modify ---
// - Add request body textarea for POST/PUT requests
// - Add custom headers input
// - Implement request history with localStorage
// - Add response time graphing`,

  typescript: `// \u{1F310} Typed API Client (TypeScript)
// Transpiled and run in the browser with full type safety.
// Demonstrates generic fetch wrappers and typed responses.

interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  phone: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Todo {
  id: number;
  title: string;
  completed: boolean;
  userId: number;
}

class TypedApiClient {
  constructor(private baseUrl: string) {}

  async get<T>(path: string): Promise<T> {
    const response = await fetch(\`\${this.baseUrl}/\${path}\`);
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}: \${response.statusText}\`);
    }
    return response.json() as Promise<T>;
  }

  async getMany<T>(path: string, limit: number = 5): Promise<T[]> {
    return this.get<T[]>(\`\${path}?_limit=\${limit}\`);
  }
}

export const client = new TypedApiClient('https://jsonplaceholder.typicode.com');
export const output = document.getElementById('output')!;
output.innerHTML = '<h3 style="color:#58a6ff;font-family:system-ui">\u{1F310} Typed API Client</h3>';

async function fetchAll(): Promise<void> {
  const users = await client.getMany<User>('users', 3);
  output.innerHTML += '<h4 style="color:#7ee787;font-family:system-ui">Users</h4>';
  output.innerHTML += \`<pre style="background:#161b22;padding:8px;border-radius:6px;font-size:12px">
\${JSON.stringify(users.map(u => ({ id: u.id, name: u.name, email: u.email })), null, 2)}</pre>\`;

  const posts = await client.getMany<Post>('posts', 3);
  output.innerHTML += '<h4 style="color:#7ee787;font-family:system-ui">Posts</h4>';
  output.innerHTML += \`<pre style="background:#161b22;padding:8px;border-radius:6px;font-size:12px">
\${JSON.stringify(posts.map(p => ({ id: p.id, title: p.title.slice(0, 50) })), null, 2)}</pre>\`;

  const todos = await client.getMany<Todo>('todos', 5);
  const completed = todos.filter(t => t.completed).length;
  output.innerHTML += \`<p style="font-family:system-ui;color:#888">
    Todos: \${completed}/\${todos.length} completed</p>\`;
}

fetchAll().catch(err => {
  output.innerHTML += \`<p style="color:#f38ba8">\${err.message}</p>\`;
});

// --- How to modify ---
// - Add a POST method with typed request bodies
// - Implement request interceptors for auth tokens
// - Add response caching with Map<string, T>
// - Create a retry wrapper with configurable attempts`,

  c: `// \u{1F310} HTTP Request Parser (C)
// Runs via JSCPP interpreter in the browser.
// Demonstrates parsing HTTP request/response formats in C.

#include <stdio.h>
#include <string.h>

typedef struct {
    char method[8];
    char path[128];
    char version[16];
    int num_headers;
    char header_names[10][64];
    char header_values[10][128];
} HttpRequest;

void parse_request_line(const char *line, HttpRequest *req) {
    int i = 0, j = 0;
    while (line[i] != ' ' && line[i]) req->method[j++] = line[i++];
    req->method[j] = 0;
    i++; j = 0;
    while (line[i] != ' ' && line[i]) req->path[j++] = line[i++];
    req->path[j] = 0;
    i++; j = 0;
    while (line[i] != '\\n' && line[i]) req->version[j++] = line[i++];
    req->version[j] = 0;
}

void print_request(const HttpRequest *req) {
    printf("=== Parsed HTTP Request ===\\n");
    printf("Method:  %s\\n", req->method);
    printf("Path:    %s\\n", req->path);
    printf("Version: %s\\n", req->version);
    printf("Headers: %d\\n", req->num_headers);
    for (int i = 0; i < req->num_headers; i++) {
        printf("  %s: %s\\n", req->header_names[i], req->header_values[i]);
    }
}

int main() {
    HttpRequest req;
    memset(&req, 0, sizeof(req));

    // Parse a sample HTTP request
    parse_request_line("GET /api/users?page=1 HTTP/1.1", &req);

    // Add headers manually
    strcpy(req.header_names[0], "Host");
    strcpy(req.header_values[0], "api.example.com");
    strcpy(req.header_names[1], "Content-Type");
    strcpy(req.header_values[1], "application/json");
    strcpy(req.header_names[2], "Authorization");
    strcpy(req.header_values[2], "Bearer token123");
    req.num_headers = 3;

    print_request(&req);

    // Build a response
    printf("\\n=== HTTP Response ===\\n");
    printf("HTTP/1.1 200 OK\\n");
    printf("Content-Type: application/json\\n");
    printf("Content-Length: 27\\n");
    printf("\\n");
    printf("{\\\"status\\\":\\\"ok\\\",\\\"count\\\":42}\\n");

    return 0;
}

// --- How to modify ---
// - Add header parsing from raw multi-line strings
// - Implement URL query string parser
// - Add response status code lookup table
// - Parse JSON body (basic key-value extraction)`,

  golang: `// \u{1F310} API Client (Go)
// The Go interpreter supports: fmt, strings, strconv, math packages.
// This demonstrates building a typed API client in Go.

package main

import "fmt"

type HttpMethod string

export const (
	GET    HttpMethod = "GET"
	POST   HttpMethod = "POST"
	PUT    HttpMethod = "PUT"
	DELETE HttpMethod = "DELETE"
)

type Request struct {
	Method  HttpMethod
	URL     string
	Headers map[string]string
	Body    string
}

type Response struct {
	StatusCode int
	Status     string
	Body       string
	Headers    map[string]string
}

func NewRequest(method HttpMethod, url string) *Request {
	return &Request{
		Method: method,
		URL:    url,
		Headers: map[string]string{
			"Content-Type": "application/json",
			"Accept":       "application/json",
		},
	}
}

func (r *Request) SetHeader(key, value string) {
	r.Headers[key] = value
}

func (r *Request) String() string {
	s := fmt.Sprintf("%s %s HTTP/1.1\\n", r.Method, r.URL)
	for k, v := range r.Headers {
		s += fmt.Sprintf("%s: %s\\n", k, v)
	}
	if r.Body != "" {
		s += fmt.Sprintf("\\n%s", r.Body)
	}
	return s
}

func mockSend(req *Request) Response {
	return Response{
		StatusCode: 200,
		Status:     "OK",
		Body:       fmt.Sprintf("{\"message\": \"Processed %s %s\"}", req.Method, req.URL),
		Headers:    map[string]string{"Content-Type": "application/json"},
	}
}

func main() {
	fmt.Println("=== Go API Client ===")
	fmt.Println()

	endpoints := []struct {
		method HttpMethod
		path   string
	}{
		{GET, "/api/users"},
		{POST, "/api/users"},
		{GET, "/api/posts?limit=10"},
		{DELETE, "/api/users/42"},
	}

	for _, ep := range endpoints {
		req := NewRequest(ep.method, ep.path)
		req.SetHeader("Authorization", "Bearer abc123")
		fmt.Println(req.String())
		resp := mockSend(req)
		fmt.Printf("=> %d %s\\n", resp.StatusCode, resp.Body)
		fmt.Println()
	}
}

// --- How to modify ---
// - Add request body support for POST/PUT
// - Implement response parsing with JSON unmarshaling
// - Add middleware chain (logging, auth, retry)
// - Create a route matcher for mock server`,

  rust: `// \u{1F310} HTTP Client Builder (Rust)
// Compiled to WebAssembly and executed in the browser.
// Demonstrates the builder pattern for HTTP clients in Rust.

use std::collections::HashMap;

#[derive(Debug)]
enum Method { Get, Post, Put, Delete }

impl std::fmt::Display for Method {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            Method::Get => write!(f, "GET"),
            Method::Post => write!(f, "POST"),
            Method::Put => write!(f, "PUT"),
            Method::Delete => write!(f, "DELETE"),
        }
    }
}

struct RequestBuilder {
    method: Method,
    url: String,
    headers: HashMap<String, String>,
    body: Option<String>,
}

impl RequestBuilder {
    fn new(method: Method, url: &str) -> Self {
        RequestBuilder {
            method,
            url: url.to_string(),
            headers: HashMap::new(),
            body: None,
        }
    }

    fn header(mut self, key: &str, value: &str) -> Self {
        self.headers.insert(key.to_string(), value.to_string());
        self
    }

    fn body(mut self, body: &str) -> Self {
        self.body = Some(body.to_string());
        self
    }

    fn build(&self) -> String {
        let mut req = format!("{} {} HTTP/1.1\\n", self.method, self.url);
        for (k, v) in &self.headers {
            req.push_str(&format!("{}: {}\\n", k, v));
        }
        if let Some(body) = &self.body {
            req.push_str(&format!("\\n{}", body));
        }
        req
    }
}

fn main() {
    println!("=== Rust HTTP Client Builder ===\\n");

    let get_req = RequestBuilder::new(Method::Get, "/api/users")
        .header("Accept", "application/json")
        .header("Authorization", "Bearer token123")
        .build();
    println!("{}\\n", get_req);

    let post_req = RequestBuilder::new(Method::Post, "/api/users")
        .header("Content-Type", "application/json")
        .body(r#"{"name": "Alice", "email": "alice@example.com"}"#)
        .build();
    println!("{}\\n", post_req);

    let delete_req = RequestBuilder::new(Method::Delete, "/api/users/42")
        .header("Authorization", "Bearer token123")
        .build();
    println!("{}", delete_req);
}

// --- How to modify ---
// - Add query parameter builder with url encoding
// - Implement response struct with status codes
// - Add connection pooling simulation
// - Create a middleware trait for request/response interceptors`,
};

// ---------------------------------------------------------------------------
// DISPLAY MODIFIER templates
// ---------------------------------------------------------------------------
