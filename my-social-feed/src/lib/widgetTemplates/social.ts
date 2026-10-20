// Widget code templates for the social category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const socialTemplates: Record<string, string> = {
  python: `# \u{1F465} Social Feed Simulator (Python)
# Runs via Pyodide in the browser. Full standard library available!
# Simulates a social media feed with posts, likes, and comments.

import random
from dataclasses import dataclass, field
from typing import List
from datetime import datetime, timedelta

@dataclass
class Comment:
    author: str
    text: str
    timestamp: str

@dataclass
class Post:
    author: str
    content: str
    likes: int = 0
    comments: List[Comment] = field(default_factory=list)
    timestamp: str = ""

    def like(self):
        self.likes += 1

    def add_comment(self, author: str, text: str):
        self.comments.append(Comment(author, text, "just now"))

    def display(self):
        print(f"\u250C{'─' * 40}")
        print(f"\u2502 @{self.author}  \u00B7  {self.timestamp}")
        print(f"\u2502 {self.content}")
        print(f"\u2502 \u2764\uFE0F {self.likes}  \u{1F4AC} {len(self.comments)}")
        for c in self.comments:
            print(f"\u2502   @{c.author}: {c.text}")
        print(f"\u2514{'─' * 40}")

class SocialFeed:
    def __init__(self):
        self.posts: List[Post] = []

    def create_post(self, author: str, content: str) -> Post:
        post = Post(author=author, content=content,
                    timestamp=f"{random.randint(1,23)}h ago")
        self.posts.append(post)
        return post

    def trending(self, n: int = 3) -> List[Post]:
        return sorted(self.posts, key=lambda p: p.likes, reverse=True)[:n]

# Build a sample feed
feed = SocialFeed()
users = ["alice", "bob", "charlie", "diana", "eve"]
topics = [
    "Just deployed my first widget! \u{1F680}",
    "Python is amazing for rapid prototyping",
    "Working on a new data visualization tool",
    "Anyone else love functional programming?",
    "Built a game in 50 lines of code!",
]

print("\u{1F465} Social Feed")
print("=" * 42)

for i, topic in enumerate(topics):
    post = feed.create_post(users[i % len(users)], topic)
    post.likes = random.randint(5, 50)
    if random.random() > 0.4:
        commenter = random.choice(users)
        post.add_comment(commenter, "Great post! \u{1F44D}")

for post in feed.posts:
    post.display()
    print()

print("\\n\u{1F525} Trending:")
for post in feed.trending():
    print(f"  \u2764\uFE0F {post.likes} - @{post.author}: {post.content[:40]}...")

# --- How to modify ---
# - Add follow/unfollow between users
# - Implement hashtag parsing and trending topics
# - Add repost/share functionality
# - Create a notification system`,

  javascript: `// \u{1F465} Activity Feed (JavaScript)
// Runs directly in the browser with full DOM access.
// Interactive social feed with likes and comments.

export const output = document.getElementById('output');

export const posts = [
  { id: 1, author: 'Alice', avatar: '\u{1F469}', content: 'Just launched my new widget! Check it out \u{1F680}', likes: 24, comments: ['Bob: Amazing!', 'Carol: Love it!'], time: '2h ago' },
  { id: 2, author: 'Bob', avatar: '\u{1F468}', content: 'Working on a data visualization dashboard. SQL + Canvas = \u{2764}\uFE0F', likes: 18, comments: ['Alice: Show us!'], time: '4h ago' },
  { id: 3, author: 'Carol', avatar: '\u{1F469}\u200D\u{1F4BB}', content: 'TIL: You can run Python in the browser with Pyodide. Mind blown!', likes: 42, comments: [], time: '6h ago' },
];

function renderPost(post) {
  const commentHtml = post.comments.map(c =>
    \`<div style="font-size:12px;color:#8b949e;padding:4px 0;border-top:1px solid #21262d">\${c}</div>\`
  ).join('');

  return \`<div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:8px;font-family:system-ui">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      <span style="font-size:24px">\${post.avatar}</span>
      <div>
        <strong style="color:#e6edf3">\${post.author}</strong>
        <span style="color:#8b949e;font-size:12px;margin-left:8px">\${post.time}</span>
      </div>
    </div>
    <p style="color:#c9d1d9;margin:0 0 8px;font-size:14px">\${post.content}</p>
    <div style="display:flex;gap:16px;margin-bottom:8px">
      <button onclick="likePost(\${post.id})" id="like-\${post.id}"
        style="background:none;border:none;color:#f38ba8;cursor:pointer;font-size:13px">
        \u2764\uFE0F \${post.likes}
      </button>
      <span style="color:#8b949e;font-size:13px">\u{1F4AC} \${post.comments.length}</span>
    </div>
    \${commentHtml}
  </div>\`;
}

function renderFeed() {
  output.innerHTML = \`<h3 style="color:#89b4fa;font-family:system-ui;margin:0 0 12px">\u{1F465} Activity Feed</h3>\`
    + posts.map(renderPost).join('');
}

window.likePost = function(id) {
  const post = posts.find(p => p.id === id);
  if (post) {
    post.likes++;
    renderFeed();
  }
};

renderFeed();

// --- How to modify ---
// - Add a new post form at the top
// - Implement comment adding with an input field
// - Add share/repost buttons
// - Implement infinite scroll with more posts`,

  typescript: `// \u{1F465} Social Profile Card (TypeScript)
// Transpiled and run in the browser with type checking.
// Creates interactive social profile components.

interface UserProfile {
  name: string;
  username: string;
  avatar: string;
  bio: string;
  stats: { following: number; followers: number; posts: number };
  badges: string[];
  isFollowing: boolean;
}

interface Activity {
  type: 'post' | 'like' | 'comment' | 'follow';
  text: string;
  time: string;
  icon: string;
}

export const profiles: UserProfile[] = [
  {
    name: 'Alice Dev', username: 'alice', avatar: '\u{1F469}\u200D\u{1F4BB}',
    bio: 'Full-stack developer. Building cool widgets.', isFollowing: false,
    stats: { following: 234, followers: 1892, posts: 42 },
    badges: ['\u{1F31F} Top Creator', '\u{1F3AE} Game Dev', '\u{26A1} Lambda Pro'],
  },
  {
    name: 'Bob Hacker', username: 'bob', avatar: '\u{1F468}\u200D\u{1F4BB}',
    bio: 'Open source enthusiast. Rust evangelist.', isFollowing: true,
    stats: { following: 567, followers: 3401, posts: 128 },
    badges: ['\u{1F6E0}\uFE0F Tool Builder', '\u{1F4CA} Data Viz'],
  },
];

export const activities: Activity[] = [
  { type: 'post', text: 'Published "Getting Started with Widgets"', time: '1h', icon: '\u{1F4DD}' },
  { type: 'like', text: 'Liked your visualization widget', time: '2h', icon: '\u2764\uFE0F' },
  { type: 'follow', text: 'Started following you', time: '3h', icon: '\u{1F465}' },
  { type: 'comment', text: 'Commented on "SQL Tips"', time: '5h', icon: '\u{1F4AC}' },
];

function renderProfile(profile: UserProfile): string {
  const followBtn = profile.isFollowing
    ? '<button style="padding:4px 12px;background:#21262d;color:#8b949e;border:1px solid #30363d;border-radius:6px;font-size:12px">Following</button>'
    : '<button style="padding:4px 12px;background:#238636;color:#fff;border:none;border-radius:6px;font-size:12px">Follow</button>';

  return \`<div style="background:#161b22;border:1px solid #30363d;border-radius:8px;padding:12px;margin-bottom:8px">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:32px">\${profile.avatar}</span>
      <div style="flex:1">
        <strong style="color:#e6edf3">\${profile.name}</strong> \${followBtn}
        <div style="color:#8b949e;font-size:12px">@\${profile.username}</div>
      </div>
    </div>
    <p style="color:#c9d1d9;font-size:13px;margin:8px 0">\${profile.bio}</p>
    <div style="display:flex;gap:16px;font-size:12px;color:#8b949e">
      <span><strong style="color:#e6edf3">\${profile.stats.following}</strong> Following</span>
      <span><strong style="color:#e6edf3">\${profile.stats.followers.toLocaleString()}</strong> Followers</span>
      <span><strong style="color:#e6edf3">\${profile.stats.posts}</strong> Posts</span>
    </div>
    <div style="margin-top:8px">\${profile.badges.map(b => \`<span style="background:#21262d;padding:2px 8px;border-radius:12px;font-size:11px;margin-right:4px">\${b}</span>\`).join('')}</div>
  </div>\`;
}

export const output = document.getElementById('output')!;
output.innerHTML = \`
  <div style="font-family:system-ui;padding:4px">
    <h3 style="color:#58a6ff;margin:0 0 12px">\u{1F465} Social Profiles</h3>
    \${profiles.map(renderProfile).join('')}
    <h4 style="color:#8b949e;margin:12px 0 8px">Recent Activity</h4>
    \${activities.map(a => \`<div style="display:flex;gap:8px;padding:6px 0;border-bottom:1px solid #21262d;font-size:13px">
      <span>\${a.icon}</span><span style="color:#c9d1d9;flex:1">\${a.text}</span><span style="color:#8b949e">\${a.time}</span>
    </div>\`).join('')}
  </div>
\`;

// --- How to modify ---
// - Make follow buttons interactive with click handlers
// - Add a compose-post form
// - Implement profile editing
// - Add notification badges`,

  c: `// \u{1F465} Chat Simulator (C)
// Runs via JSCPP interpreter in the browser.
// Simulates a text-based chat room with message display.

#include <stdio.h>
#include <string.h>

typedef struct {
    char sender[20];
    char message[128];
    char time[8];
} ChatMessage;

void print_divider() {
    printf("+");
    for (int i = 0; i < 48; i++) printf("-");
    printf("+\\n");
}

void print_message(ChatMessage msg, int align_right) {
    int msg_len = strlen(msg.message);
    int padding = 44 - msg_len;
    if (padding < 0) padding = 0;

    if (align_right) {
        printf("|%*s[%s %s] |\\n", padding, "", msg.sender, msg.time);
        printf("|%*s%s |\\n", padding, "", msg.message);
    } else {
        printf("| [%s %s]%*s|\\n", msg.sender, msg.time, padding - 2, "");
        printf("| %s%*s|\\n", msg.message, padding - 1, "");
    }
    printf("|%48s|\\n", "");
}

int main() {
    printf("=== Chat Room Simulator ===\\n\\n");
    print_divider();
    printf("|  #general                                      |\\n");
    print_divider();

    ChatMessage chat[] = {
        {"Alice", "Hey everyone!", "10:01"},
        {"Bob", "Hi Alice! How's the project?", "10:02"},
        {"Alice", "Going great! Just finished the API.", "10:03"},
        {"Carol", "Nice work! Can I see a demo?", "10:05"},
        {"Alice", "Sure! Let me share my screen.", "10:06"},
        {"Bob", "Looking forward to it!", "10:07"},
    };

    int count = 6;
    for (int i = 0; i < count; i++) {
        print_message(chat[i], i % 2);
    }

    print_divider();
    printf("\\n  %d messages | 3 participants | #general\\n", count);

    return 0;
}

// --- How to modify ---
// - Add user status indicators (online, away, offline)
// - Implement message threading
// - Add emoji reactions as integer counters
// - Create private message channels`,

  sql: `-- \u{1F465} Social Network Schema (SQL)
-- Executed via sql.js (SQLite compiled to WebAssembly).
-- Models a social network with users, posts, follows, and likes.

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    joined_at TEXT
);

CREATE TABLE follows (
    follower_id INTEGER REFERENCES users(id),
    following_id INTEGER REFERENCES users(id),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE posts (
    id INTEGER PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    content TEXT NOT NULL,
    created_at TEXT
);

CREATE TABLE likes (
    user_id INTEGER REFERENCES users(id),
    post_id INTEGER REFERENCES posts(id),
    PRIMARY KEY (user_id, post_id)
);

-- Seed data
INSERT INTO users VALUES (1, 'alice', 'Alice Dev', 'Full-stack developer', '2024-01-01');
INSERT INTO users VALUES (2, 'bob', 'Bob Hacker', 'Open source fan', '2024-01-15');
INSERT INTO users VALUES (3, 'carol', 'Carol Data', 'Data scientist', '2024-02-01');

INSERT INTO follows VALUES (1, 2); INSERT INTO follows VALUES (1, 3);
INSERT INTO follows VALUES (2, 1); INSERT INTO follows VALUES (3, 1);
INSERT INTO follows VALUES (3, 2);

INSERT INTO posts VALUES (1, 1, 'Hello world! First post!', '2024-01-05');
INSERT INTO posts VALUES (2, 2, 'Building widgets is fun', '2024-01-20');
INSERT INTO posts VALUES (3, 1, 'Check out my new game widget', '2024-02-10');
INSERT INTO posts VALUES (4, 3, 'Data viz with SQL is powerful', '2024-02-15');

INSERT INTO likes VALUES (2, 1); INSERT INTO likes VALUES (3, 1);
INSERT INTO likes VALUES (1, 2); INSERT INTO likes VALUES (3, 2);
INSERT INTO likes VALUES (1, 4); INSERT INTO likes VALUES (2, 4);

-- User profiles with follow counts
SELECT u.username, u.display_name,
    (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) AS following,
    (SELECT COUNT(*) FROM follows WHERE following_id = u.id) AS followers,
    (SELECT COUNT(*) FROM posts WHERE user_id = u.id) AS post_count
FROM users u;

-- Feed for alice (posts from people she follows)
SELECT p.content, u.username,
    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) AS like_count
FROM posts p
JOIN users u ON p.user_id = u.id
WHERE p.user_id IN (SELECT following_id FROM follows WHERE follower_id = 1)
ORDER BY p.created_at DESC;

-- Most liked posts
SELECT p.content, u.username, COUNT(l.user_id) AS likes
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN likes l ON p.id = l.post_id
GROUP BY p.id ORDER BY likes DESC;

-- --- How to modify ---
-- Add comments table and link to posts
-- Implement hashtag extraction and trending topics
-- Add direct messages table
-- Create mutual follow queries`,

  ruby: `# \u{1F465} Social Graph Analyzer (Ruby)
# Interpreted via Opal (Ruby-to-JS compiler) in the browser.
# Analyzes social connections and influence.

class SocialGraph
  attr_reader :users, :edges

  def initialize
    @users = {}
    @edges = []
  end

  def add_user(id, name)
    @users[id] = { name: name, followers: [], following: [] }
  end

  def follow(from, to)
    return if from == to
    @users[from][:following] << to unless @users[from][:following].include?(to)
    @users[to][:followers] << from unless @users[to][:followers].include?(from)
    @edges << [from, to]
  end

  def mutual_follows(user_id)
    following = @users[user_id][:following]
    followers = @users[user_id][:followers]
    following & followers
  end

  def influence_score(user_id)
    followers = @users[user_id][:followers]
    # Score = direct followers + indirect reach / 2
    indirect = followers.flat_map { |f| @users[f][:followers] }.uniq - [user_id]
    followers.length + indirect.length * 0.5
  end

  def suggest_follows(user_id, limit: 3)
    following = @users[user_id][:following]
    candidates = following
      .flat_map { |f| @users[f][:following] }
      .reject { |id| id == user_id || following.include?(id) }
      .tally
      .sort_by { |_, count| -count }
      .first(limit)
      .map { |id, count| { user: @users[id][:name], mutual: count } }
  end
end

graph = SocialGraph.new
%w[alice bob carol diana eve frank].each_with_index do |name, i|
  graph.add_user(i, name.capitalize)
end

# Build connections
[[0,1],[0,2],[1,0],[1,3],[2,0],[2,1],[2,4],[3,1],[3,4],[4,2],[4,5],[5,3],[5,4]].each do |f, t|
  graph.follow(f, t)
end

puts "\u{1F465} Social Graph Analyzer"
puts "=" * 40

graph.users.each do |id, user|
  score = graph.influence_score(id)
  mutuals = graph.mutual_follows(id)
  puts "  @#{user[:name]}: #{user[:followers].length} followers, " \
       "#{user[:following].length} following, " \
       "influence: #{score}, mutuals: #{mutuals.length}"
end

puts "\\nFollow suggestions for Alice:"
graph.suggest_follows(0).each do |s|
  puts "  -> #{s[:user]} (#{s[:mutual]} mutual connections)"
end

# --- How to modify ---
# - Add weighted edges (close friend vs acquaintance)
# - Implement community detection with clustering
# - Add content-based recommendations
# - Calculate PageRank-style influence scores`,
};
