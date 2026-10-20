// Widget code templates for the games category — split from
// widgetTemplates.ts. Kept as a single data file per category; the
// size is inherent to the multi-language template strings inside.

export const gameTemplates: Record<string, string> = {
  python: `# \u{1F3AE} Number Guessing Game
# The runtime runs this Python code in-browser via Pyodide.
# You can use any Python standard library!

import random

target = random.randint(1, 100)
print("\u{1F3AE} Guess the Number (1-100)")
print("=" * 30)

# Since we can't do input() in browser, simulate 7 guesses
for attempt in range(1, 8):
    guess = random.randint(1, 100)  # Replace with your game logic
    if guess < target:
        print(f"Attempt {attempt}: {guess} \u2014 Too low!")
    elif guess > target:
        print(f"Attempt {attempt}: {guess} \u2014 Too high!")
    else:
        print(f"Attempt {attempt}: {guess} \u2014 \u{1F389} Correct!")
        break
else:
    print(f"\\nThe number was {target}. Better luck next time!")

# --- How to modify ---
# - Change the range in randint() for easier/harder games
# - Replace the random guess with AI logic (binary search!)
# - Add scoring based on number of attempts
# - Import 'time' to add timing challenges`,

  javascript: `// \u{1F3AE} Snake Game
// This runs directly in the browser. You have access to the DOM.
// The output div is available as document.getElementById('output')

export const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
canvas.style.border = '2px solid #333';
canvas.style.borderRadius = '4px';
canvas.style.background = '#111';
document.getElementById('output').appendChild(canvas);

export const ctx = canvas.getContext('2d');
export const SIZE = 15;
export const COLS = Math.floor(canvas.width / SIZE);
export const ROWS = Math.floor(canvas.height / SIZE);

let snake = [{ x: 10, y: 10 }];
let dir = { x: 1, y: 0 };
let food = randomPos();
let score = 0;
let gameOver = false;

function randomPos() {
  return {
    x: Math.floor(Math.random() * COLS),
    y: Math.floor(Math.random() * ROWS)
  };
}

document.addEventListener('keydown', e => {
  if (gameOver && e.key === ' ') {
    snake = [{ x: 10, y: 10 }];
    dir = { x: 1, y: 0 };
    food = randomPos();
    score = 0;
    gameOver = false;
    return;
  }
  const moves = {
    ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 },
    ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }
  };
  if (moves[e.key] && (moves[e.key].x + dir.x || moves[e.key].y + dir.y)) {
    dir = moves[e.key];
  }
});

setInterval(() => {
  if (gameOver) return;
  const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };
  if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS ||
      snake.some(s => s.x === head.x && s.y === head.y)) {
    gameOver = true;
    return;
  }
  snake.unshift(head);
  if (head.x === food.x && head.y === food.y) {
    score++;
    food = randomPos();
  } else {
    snake.pop();
  }
  ctx.fillStyle = '#111';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f0';
  snake.forEach(s => ctx.fillRect(s.x * SIZE, s.y * SIZE, SIZE - 1, SIZE - 1));
  ctx.fillStyle = '#f44';
  ctx.fillRect(food.x * SIZE, food.y * SIZE, SIZE - 1, SIZE - 1);
  ctx.fillStyle = '#fff';
  ctx.font = '12px monospace';
  ctx.fillText('Score: ' + score, 8, 16);
  if (gameOver) {
    ctx.fillText('Game Over! Press SPACE to restart', 80, 150);
  }
}, 100);

// --- How to modify ---
// - Change SIZE to adjust grid resolution
// - Add obstacles by checking collision with a walls[] array
// - Implement wrap-around instead of wall death
// - Add a speed increase as score grows`,

  typescript: `// \u{1F3AE} Pong Game (TypeScript)
// Transpiled and executed in the browser. Full DOM access available.
// Type annotations are checked at transpile time.

interface Paddle {
  x: number; y: number; w: number; h: number; dy: number;
}
interface Ball {
  x: number; y: number; dx: number; dy: number; r: number;
}

export const canvas = document.createElement('canvas');
canvas.width = 400;
canvas.height = 300;
canvas.style.background = '#0d1117';
document.getElementById('output')!.appendChild(canvas);
export const ctx = canvas.getContext('2d')!;

export const paddle: Paddle = { x: 10, y: 130, w: 10, h: 60, dy: 0 };
export const ai: Paddle = { x: 380, y: 130, w: 10, h: 60, dy: 0 };
export const ball: Ball = { x: 200, y: 150, dx: 3, dy: 2, r: 6 };
let pScore = 0;
let aScore = 0;

document.addEventListener('keydown', (e: KeyboardEvent) => {
  if (e.key === 'ArrowUp') paddle.dy = -5;
  if (e.key === 'ArrowDown') paddle.dy = 5;
});
document.addEventListener('keyup', () => { paddle.dy = 0; });

function gameLoop(): void {
  paddle.y = Math.max(0, Math.min(240, paddle.y + paddle.dy));
  ai.y += (ball.y - ai.y - 30) * 0.08;

  ball.x += ball.dx;
  ball.y += ball.dy;
  if (ball.y <= 0 || ball.y >= 294) ball.dy *= -1;
  if (ball.x <= 20 && ball.y >= paddle.y && ball.y <= paddle.y + 60) ball.dx = Math.abs(ball.dx);
  if (ball.x >= 380 && ball.y >= ai.y && ball.y <= ai.y + 60) ball.dx = -Math.abs(ball.dx);
  if (ball.x < 0) { aScore++; ball.x = 200; ball.y = 150; }
  if (ball.x > 400) { pScore++; ball.x = 200; ball.y = 150; }

  ctx.fillStyle = '#0d1117';
  ctx.fillRect(0, 0, 400, 300);
  ctx.fillStyle = '#58a6ff';
  ctx.fillRect(paddle.x, paddle.y, paddle.w, paddle.h);
  ctx.fillStyle = '#f78166';
  ctx.fillRect(ai.x, ai.y, ai.w, ai.h);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '24px monospace';
  ctx.fillText(String(pScore), 170, 30);
  ctx.fillText(String(aScore), 210, 30);
  requestAnimationFrame(gameLoop);
}
gameLoop();

// --- How to modify ---
// - Adjust ai tracking speed (0.08) to change difficulty
// - Add ball speed increase on each paddle hit
// - Implement power-ups by spawning items on the field
// - Add particle effects on ball bounce`,

  c: `// \u{1F3AE} Tic-Tac-Toe (C)
// Runs via JSCPP interpreter in the browser.
// Supports: stdio, stdlib, string, math headers.

#include <stdio.h>
#include <stdlib.h>

int board[9] = {0};

void print_board() {
    printf("\\n");
    for (int i = 0; i < 9; i++) {
        if (board[i] == 0) printf(" %d ", i + 1);
        else if (board[i] == 1) printf(" X ");
        else printf(" O ");
        if (i % 3 < 2) printf("|");
        else if (i < 8) printf("\\n---+---+---\\n");
    }
    printf("\\n\\n");
}

int check_winner() {
    int wins[8][3] = {
        {0,1,2},{3,4,5},{6,7,8},
        {0,3,6},{1,4,7},{2,5,8},
        {0,4,8},{2,4,6}
    };
    for (int i = 0; i < 8; i++) {
        int a = wins[i][0], b = wins[i][1], c = wins[i][2];
        if (board[a] && board[a] == board[b] && board[b] == board[c])
            return board[a];
    }
    return 0;
}

int main() {
    printf("Tic-Tac-Toe\\n");
    printf("X plays odd positions, O plays even.\\n");

    int moves[] = {5, 1, 3, 7, 9, 2, 4, 8, 6};
    for (int turn = 0; turn < 9; turn++) {
        int pos = moves[turn] - 1;
        board[pos] = (turn % 2 == 0) ? 1 : 2;
        print_board();
        int w = check_winner();
        if (w) {
            printf("Player %c wins!\\n", w == 1 ? 'X' : 'O');
            return 0;
        }
    }
    printf("It's a draw!\\n");
    return 0;
}

// --- How to modify ---
// - Change the moves[] array to try different games
// - Add a simple AI that picks the best available move
// - Implement minimax for unbeatable AI
// - Add board size option (4x4, 5x5)`,

  basic: `REM \u{1F3AE} Number Guessing Game in BASIC
REM Supports: PRINT, LET, IF/THEN, FOR/NEXT, GOTO, INPUT, REM
REM
REM --- How to modify ---
REM Change line 40 to set a different target number
REM The INPUT statement pauses and waits for the user to type a number

10 PRINT "================================"
20 PRINT "   Number Guessing Game!"
30 PRINT "================================"
40 LET TARGET = 42
50 LET TRIES = 0
60 PRINT "I'm thinking of a number between 1 and 100."
70 PRINT ""
80 INPUT "Your guess", GUESS
90 LET TRIES = TRIES + 1
100 IF GUESS = TARGET THEN GOTO 160
110 IF GUESS < TARGET THEN PRINT "Too LOW! Try higher."
120 IF GUESS > TARGET THEN PRINT "Too HIGH! Try lower."
130 IF TRIES > 9 THEN GOTO 180
140 PRINT "Attempts so far: "; TRIES
150 GOTO 70
160 PRINT "Correct! The number was "; TARGET
170 PRINT "You got it in "; TRIES; " tries!"
175 GOTO 190
180 PRINT "Out of attempts! The number was "; TARGET
190 PRINT "================================"
200 PRINT "      Thanks for playing!"
210 END`,

  rust: `// \u{1F3AE} Dungeon Crawler (Rust)
// Compiled to WebAssembly and executed in the browser.
// Supports standard Rust syntax, structs, enums, and pattern matching.

use std::fmt;

#[derive(Debug, Clone, Copy)]
enum Tile { Empty, Wall, Player, Treasure, Exit }

impl fmt::Display for Tile {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            Tile::Empty => write!(f, " . "),
            Tile::Wall => write!(f, " # "),
            Tile::Player => write!(f, " @ "),
            Tile::Treasure => write!(f, " $ "),
            Tile::Exit => write!(f, " E "),
        }
    }
}

struct Game {
    grid: Vec<Vec<Tile>>,
    player: (usize, usize),
    score: u32,
}

impl Game {
    fn new() -> Self {
        let mut grid = vec![vec![Tile::Empty; 8]; 6];
        // Walls
        for i in 0..8 { grid[0][i] = Tile::Wall; grid[5][i] = Tile::Wall; }
        for i in 0..6 { grid[i][0] = Tile::Wall; grid[i][7] = Tile::Wall; }
        grid[2][3] = Tile::Wall;
        grid[3][5] = Tile::Wall;
        // Items
        grid[1][6] = Tile::Treasure;
        grid[3][2] = Tile::Treasure;
        grid[4][6] = Tile::Exit;
        grid[1][1] = Tile::Player;
        Game { grid, player: (1, 1), score: 0 }
    }

    fn render(&self) {
        println!("Score: {} | Find treasures ($) then reach Exit (E)", self.score);
        for row in &self.grid {
            let line: String = row.iter().map(|t| format!("{}", t)).collect();
            println!("{}", line);
        }
    }

    fn move_player(&mut self, dx: i32, dy: i32) {
        let ny = (self.player.0 as i32 + dy) as usize;
        let nx = (self.player.1 as i32 + dx) as usize;
        if ny < 6 && nx < 8 {
            match self.grid[ny][nx] {
                Tile::Wall => println!("Blocked by wall!"),
                Tile::Treasure => {
                    self.score += 100;
                    println!("+100 points!");
                    self.grid[self.player.0][self.player.1] = Tile::Empty;
                    self.grid[ny][nx] = Tile::Player;
                    self.player = (ny, nx);
                }
                _ => {
                    self.grid[self.player.0][self.player.1] = Tile::Empty;
                    self.grid[ny][nx] = Tile::Player;
                    self.player = (ny, nx);
                }
            }
        }
    }
}

fn main() {
    let mut game = Game::new();
    println!("=== Dungeon Crawler ===");
    game.render();
    // Simulate a series of moves
    let moves = vec![(1,0),(1,0),(0,1),(0,1),(1,0),(1,0),(1,0)];
    for (dx, dy) in moves {
        game.move_player(dx, dy);
        game.render();
    }
}

// --- How to modify ---
// - Edit the grid layout to design new levels
// - Add enemies with patrol patterns
// - Implement inventory with items
// - Add fog-of-war by only showing tiles near the player`,

  golang: `// \u{1F3AE} Game of Life (Go)
// The Go interpreter supports: fmt, strings, strconv, math packages.
// This implements Conway's Game of Life simulation.

package main

import "fmt"

export const rows = 10
export const cols = 20

type Grid [rows][cols]bool

func newGrid() Grid {
	var g Grid
	// Glider
	g[1][2] = true
	g[2][3] = true
	g[3][1] = true
	g[3][2] = true
	g[3][3] = true
	// Blinker
	g[5][10] = true
	g[5][11] = true
	g[5][12] = true
	return g
}

func neighbors(g Grid, r, c int) int {
	count := 0
	for dr := -1; dr <= 1; dr++ {
		for dc := -1; dc <= 1; dc++ {
			if dr == 0 && dc == 0 {
				continue
			}
			nr := (r + dr + rows) % rows
			nc := (c + dc + cols) % cols
			if g[nr][nc] {
				count++
			}
		}
	}
	return count
}

func step(g Grid) Grid {
	var next Grid
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			n := neighbors(g, r, c)
			if g[r][c] {
				next[r][c] = n == 2 || n == 3
			} else {
				next[r][c] = n == 3
			}
		}
	}
	return next
}

func display(g Grid, gen int) {
	fmt.Printf("=== Generation %d ===\\n", gen)
	for r := 0; r < rows; r++ {
		for c := 0; c < cols; c++ {
			if g[r][c] {
				fmt.Print("\u2588 ")
			} else {
				fmt.Print(". ")
			}
		}
		fmt.Println()
	}
	fmt.Println()
}

func main() {
	grid := newGrid()
	for gen := 0; gen < 8; gen++ {
		display(grid, gen)
		grid = step(grid)
	}
	fmt.Println("Simulation complete!")
}

// --- How to modify ---
// - Edit newGrid() to create different starting patterns
// - Try: block (2x2), beacon, pulsar, or random fill
// - Change rows/cols for a bigger or smaller universe
// - Add population counting per generation`,
};

// ---------------------------------------------------------------------------
// TOOL templates
// ---------------------------------------------------------------------------
