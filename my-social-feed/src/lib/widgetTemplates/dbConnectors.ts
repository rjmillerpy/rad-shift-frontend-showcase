// Widget code templates for the dbConnectors category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const dbConnectorTemplates: Record<string, string> = {
  sql: `-- \u{1F5C4}\uFE0F Database Explorer
-- sql.js provides a full SQLite database in the browser.
-- Create tables, insert data, and query freely!

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    active BOOLEAN DEFAULT 1,
    created_at TEXT DEFAULT '2024-01-01'
);

INSERT INTO users VALUES (1, 'Alice', 'alice@example.com', 'admin', 1, '2024-01-15');
INSERT INTO users VALUES (2, 'Bob', 'bob@example.com', 'editor', 1, '2024-02-20');
INSERT INTO users VALUES (3, 'Charlie', 'charlie@example.com', 'user', 0, '2024-03-10');
INSERT INTO users VALUES (4, 'Diana', 'diana@example.com', 'editor', 1, '2024-03-15');
INSERT INTO users VALUES (5, 'Eve', 'eve@example.com', 'user', 1, '2024-04-01');

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title TEXT NOT NULL,
    content TEXT,
    likes INTEGER DEFAULT 0,
    created_at TEXT
);

INSERT INTO posts VALUES (1, 1, 'Getting Started', 'Welcome to the platform!', 42, '2024-01-20');
INSERT INTO posts VALUES (2, 2, 'SQL Tips', 'Learn advanced queries...', 28, '2024-02-25');
INSERT INTO posts VALUES (3, 1, 'API Design', 'Best practices for APIs...', 35, '2024-03-05');
INSERT INTO posts VALUES (4, 4, 'Data Modeling', 'How to design schemas...', 19, '2024-03-20');

-- Active users with their post counts
SELECT u.name, u.role, COUNT(p.id) AS posts, COALESCE(SUM(p.likes), 0) AS total_likes
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
WHERE u.active = 1
GROUP BY u.id
ORDER BY total_likes DESC;

-- Most popular posts
SELECT p.title, u.name AS author, p.likes
FROM posts p JOIN users u ON p.user_id = u.id
ORDER BY p.likes DESC;

-- Role distribution
SELECT role, COUNT(*) AS count FROM users GROUP BY role;

-- --- How to modify ---
-- Add more tables (comments, tags, categories)
-- Create indexes for performance: CREATE INDEX idx_user_email ON users(email)
-- Add date filtering: WHERE created_at BETWEEN '2024-01-01' AND '2024-06-30'
-- Try subqueries: SELECT * FROM users WHERE id IN (SELECT user_id FROM posts WHERE likes > 30)`,

  python: `# \u{1F5C4}\uFE0F Database Connector (Python)
# Runs via Pyodide in the browser.
# Uses Python's built-in sqlite3 module (included in Pyodide).

import sqlite3
import json

db = sqlite3.connect(":memory:")
db.row_factory = sqlite3.Row
cursor = db.cursor()

# Create schema
cursor.execute("""
    CREATE TABLE products (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        price REAL,
        category TEXT,
        in_stock BOOLEAN DEFAULT 1
    )
""")

cursor.execute("""
    CREATE TABLE orders (
        id INTEGER PRIMARY KEY,
        product_id INTEGER REFERENCES products(id),
        quantity INTEGER,
        order_date TEXT
    )
""")

# Insert data
products = [
    ("Widget A", 29.99, "hardware", 1),
    ("Widget B", 49.99, "software", 1),
    ("Widget C", 19.99, "hardware", 1),
    ("Widget D", 99.99, "software", 0),
    ("Widget E", 14.99, "accessories", 1),
]
cursor.executemany(
    "INSERT INTO products (name, price, category, in_stock) VALUES (?, ?, ?, ?)",
    products
)

orders = [
    (1, 5, "2024-01-15"), (2, 3, "2024-01-20"),
    (1, 2, "2024-02-10"), (3, 8, "2024-02-15"),
    (5, 12, "2024-03-01"), (2, 1, "2024-03-10"),
]
cursor.executemany(
    "INSERT INTO orders (product_id, quantity, order_date) VALUES (?, ?, ?)",
    orders
)
db.commit()

print("\u{1F5C4}\uFE0F Database Explorer")
print("=" * 50)

# Query 1: All in-stock products
print("\\nIn-stock products:")
for row in cursor.execute("SELECT * FROM products WHERE in_stock = 1"):
    dollar = "$"
    print(f"  [{row['id']}] {row['name']:12s} {dollar}{row['price']:>7.2f}  ({row['category']})")

# Query 2: Revenue by category
print("\\nRevenue by category:")
cursor.execute("""
    SELECT p.category,
           SUM(o.quantity) AS units_sold,
           ROUND(SUM(o.quantity * p.price), 2) AS revenue
    FROM orders o
    JOIN products p ON o.product_id = p.id
    GROUP BY p.category
    ORDER BY revenue DESC
""")
for row in cursor.fetchall():
    print(f"  {row['category']:12s} {row['units_sold']:3d} units  {dollar}{row['revenue']:>8.2f}")

# Query 3: Top-selling product
print("\\nTop-selling product:")
cursor.execute("""
    SELECT p.name, SUM(o.quantity) AS total
    FROM orders o JOIN products p ON o.product_id = p.id
    GROUP BY p.id ORDER BY total DESC LIMIT 1
""")
row = cursor.fetchone()
print(f"  {row['name']} ({row['total']} units)")

db.close()

# --- How to modify ---
# - Add a customers table and link to orders
# - Implement full-text search with FTS5
# - Add date-range filtering for reports
# - Create helper functions for CRUD operations`,

  javascript: `// \u{1F5C4}\uFE0F IndexedDB Data Store (JavaScript)
// Runs directly in the browser using the IndexedDB API.
// A persistent key-value store with query capabilities.

export const output = document.getElementById('output');
output.innerHTML = '<h3 style="color:#89b4fa;font-family:system-ui">\u{1F5C4}\uFE0F IndexedDB Explorer</h3>';

export const DB_NAME = 'widget_store';
export const STORE_NAME = 'data';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function putItem(db, item) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getAll(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function log(html) {
  output.innerHTML += \`<div style="font-family:monospace;font-size:13px;margin:4px 0;padding:4px 8px;
    background:#16213e;border-radius:4px">\${html}</div>\`;
}

(async () => {
  const db = await openDB();

  // Insert sample data
  const items = [
    { name: 'Alice', type: 'user', score: 95 },
    { name: 'Bob', type: 'user', score: 82 },
    { name: 'Config A', type: 'setting', value: 'dark-mode' },
    { name: 'Config B', type: 'setting', value: 'notifications-on' },
  ];

  for (const item of items) {
    const id = await putItem(db, item);
    log(\`\u{2705} Inserted: \${item.name} (id: \${id})\`);
  }

  // Read all
  const all = await getAll(db);
  log(\`<br><strong>All records (\${all.length}):</strong>\`);
  all.forEach(item => {
    log(\`&nbsp;&nbsp;[\${item.id}] \${item.name} (\${item.type})\`);
  });

  // Filter in JS
  const users = all.filter(i => i.type === 'user');
  const avgScore = users.reduce((s, u) => s + (u.score || 0), 0) / users.length;
  log(\`<br>Users: \${users.length}, Avg score: \${avgScore.toFixed(1)}\`);

  db.close();
})();

// --- How to modify ---
// - Add indexes for faster querying (createIndex in onupgradeneeded)
// - Implement delete and update operations
// - Add a search UI with filtering
// - Build import/export functionality (JSON)`,

  typescript: `// \u{1F5C4}\uFE0F Typed Data Layer (TypeScript)
// Transpiled and run in the browser with type checking.
// A type-safe ORM-like abstraction over in-memory storage.

interface Model {
  id: number;
  createdAt: string;
}

interface User extends Model {
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  active: boolean;
}

interface Post extends Model {
  userId: number;
  title: string;
  content: string;
  likes: number;
}

class Collection<T extends Model> {
  private items: T[] = [];
  private nextId = 1;

  insert(item: Omit<T, 'id' | 'createdAt'>): T {
    const record = { ...item, id: this.nextId++, createdAt: new Date().toISOString() } as T;
    this.items.push(record);
    return record;
  }

  findAll(): T[] { return [...this.items]; }
  findById(id: number): T | undefined { return this.items.find(i => i.id === id); }
  where(predicate: (item: T) => boolean): T[] { return this.items.filter(predicate); }
  count(): number { return this.items.length; }

  aggregate<R>(fn: (items: T[]) => R): R { return fn(this.items); }
}

// Build our database
export const users = new Collection<User>();
export const posts = new Collection<Post>();

users.insert({ name: 'Alice', email: 'alice@test.com', role: 'admin', active: true });
users.insert({ name: 'Bob', email: 'bob@test.com', role: 'editor', active: true });
users.insert({ name: 'Charlie', email: 'charlie@test.com', role: 'viewer', active: false });

posts.insert({ userId: 1, title: 'Getting Started', content: 'Welcome!', likes: 42 });
posts.insert({ userId: 2, title: 'TypeScript Tips', content: 'Use generics...', likes: 28 });
posts.insert({ userId: 1, title: 'Advanced Patterns', content: 'Builder pattern...', likes: 35 });

export const output = document.getElementById('output')!;
output.innerHTML = '<h3 style="color:#58a6ff;font-family:system-ui">\u{1F5C4}\uFE0F Typed Data Layer</h3>';

// Queries
export const activeUsers = users.where(u => u.active);
output.innerHTML += \`<pre style="background:#161b22;padding:8px;border-radius:6px;font-size:12px">Active Users:
\${JSON.stringify(activeUsers.map(u => ({ name: u.name, role: u.role })), null, 2)}</pre>\`;

export const totalLikes = posts.aggregate(items => items.reduce((sum, p) => sum + p.likes, 0));
output.innerHTML += \`<p style="font-family:system-ui;color:#888">Total likes across \${posts.count()} posts: \${totalLikes}</p>\`;

// Join simulation
export const postsWithAuthors = posts.findAll().map(p => ({
  title: p.title,
  author: users.findById(p.userId)?.name ?? 'Unknown',
  likes: p.likes,
}));
output.innerHTML += \`<pre style="background:#161b22;padding:8px;border-radius:6px;font-size:12px">Posts with Authors:
\${JSON.stringify(postsWithAuthors, null, 2)}</pre>\`;

// --- How to modify ---
// - Add update() and delete() methods to Collection
// - Implement indexing for faster lookups
// - Add relationship helpers (hasMany, belongsTo)
// - Build a migration system for schema changes`,

  c: `// \u{1F5C4}\uFE0F In-Memory Database (C)
// Runs via JSCPP interpreter in the browser.
// Implements a simple key-value store with hash table.

#include <stdio.h>
#include <string.h>
#include <stdlib.h>

#define TABLE_SIZE 64
#define KEY_LEN 32
#define VAL_LEN 128

typedef struct Entry {
    char key[KEY_LEN];
    char value[VAL_LEN];
    int occupied;
} Entry;

Entry table[TABLE_SIZE];

unsigned int hash(const char *key) {
    unsigned int h = 0;
    while (*key) {
        h = h * 31 + *key;
        key++;
    }
    return h % TABLE_SIZE;
}

int db_put(const char *key, const char *value) {
    unsigned int idx = hash(key);
    for (int i = 0; i < TABLE_SIZE; i++) {
        int pos = (idx + i) % TABLE_SIZE;
        if (!table[pos].occupied || strcmp(table[pos].key, key) == 0) {
            strcpy(table[pos].key, key);
            strcpy(table[pos].value, value);
            table[pos].occupied = 1;
            return 1;
        }
    }
    return 0;
}

export const char* db_get(const char *key) {
    unsigned int idx = hash(key);
    for (int i = 0; i < TABLE_SIZE; i++) {
        int pos = (idx + i) % TABLE_SIZE;
        if (!table[pos].occupied) return NULL;
        if (strcmp(table[pos].key, key) == 0) return table[pos].value;
    }
    return NULL;
}

void db_list() {
    printf("\\n--- All Records ---\\n");
    int count = 0;
    for (int i = 0; i < TABLE_SIZE; i++) {
        if (table[i].occupied) {
            printf("  [%s] = %s\\n", table[i].key, table[i].value);
            count++;
        }
    }
    printf("Total: %d records\\n", count);
}

int main() {
    memset(table, 0, sizeof(table));
    printf("=== C Key-Value Database ===\\n");

    db_put("user:1", "Alice <alice@example.com>");
    db_put("user:2", "Bob <bob@example.com>");
    db_put("user:3", "Charlie <charlie@example.com>");
    db_put("config:theme", "dark");
    db_put("config:lang", "en");

    printf("\\nLookup results:\\n");
    printf("  user:1 -> %s\\n", db_get("user:1"));
    printf("  user:2 -> %s\\n", db_get("user:2"));
    printf("  config:theme -> %s\\n", db_get("config:theme"));
    printf("  unknown -> %s\\n", db_get("unknown") ? db_get("unknown") : "(nil)");

    db_list();
    return 0;
}

// --- How to modify ---
// - Add db_delete() function with tombstone markers
// - Implement value types (int, float, string) with a union
// - Add persistence simulation (print/parse CSV format)
// - Implement iteration with a cursor pattern`,

  golang: `// \u{1F5C4}\uFE0F In-Memory Database (Go)
// The Go interpreter supports: fmt, strings, strconv, math packages.
// Implements a document store with query capabilities.

package main

import "fmt"
import "strings"

type Document map[string]interface{}

type Collection struct {
	name string
	docs []Document
}

func NewCollection(name string) *Collection {
	return &Collection{name: name, docs: make([]Document, 0)}
}

func (c *Collection) Insert(doc Document) int {
	doc["_id"] = len(c.docs) + 1
	c.docs = append(c.docs, doc)
	return doc["_id"].(int)
}

func (c *Collection) Find(key string, value interface{}) []Document {
	results := make([]Document, 0)
	for _, doc := range c.docs {
		if doc[key] == value {
			results = append(results, doc)
		}
	}
	return results
}

func (c *Collection) All() []Document {
	return c.docs
}

func (c *Collection) Count() int {
	return len(c.docs)
}

func printDocs(docs []Document) {
	for _, doc := range docs {
		parts := make([]string, 0)
		for k, v := range doc {
			parts = append(parts, fmt.Sprintf("%s: %v", k, v))
		}
		fmt.Printf("  {%s}\\n", strings.Join(parts, ", "))
	}
}

func main() {
	fmt.Println("=== Go Document Store ===")
	fmt.Println()

	users := NewCollection("users")
	users.Insert(Document{"name": "Alice", "role": "admin", "active": true})
	users.Insert(Document{"name": "Bob", "role": "editor", "active": true})
	users.Insert(Document{"name": "Charlie", "role": "viewer", "active": false})
	users.Insert(Document{"name": "Diana", "role": "editor", "active": true})

	fmt.Printf("Total users: %d\\n\\n", users.Count())

	fmt.Println("All users:")
	printDocs(users.All())

	fmt.Println("\\nEditors:")
	printDocs(users.Find("role", "editor"))

	fmt.Println("\\nActive users:")
	printDocs(users.Find("active", true))
}

// --- How to modify ---
// - Add Update() and Delete() methods
// - Implement compound queries (AND/OR conditions)
// - Add indexing for faster lookups
// - Create a transaction wrapper with rollback`,
};

// ---------------------------------------------------------------------------
// VISUALIZATION templates
// ---------------------------------------------------------------------------
