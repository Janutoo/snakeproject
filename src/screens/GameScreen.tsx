import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  GestureResponderEvent,
  Platform,
} from 'react-native';
import { Direction, GameSettings, Position } from '../utils/types';
import { saveScore, getBestScore } from '../utils/storage';

interface Props {
  playerName: string;
  settings: GameSettings;
  onGameOver: (score: number) => void;
  onMenu: () => void;
}

function randomPosition(size: number, exclude: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * size),
      y: Math.floor(Math.random() * size),
    };
  } while (exclude.some((p) => p.x === pos.x && p.y === pos.y));
  return pos;
}

function buildInitialSnake(size: number, length: number): Position[] {
  const midY = Math.floor(size / 2);
  const startX = Math.floor(size / 2) + Math.floor(length / 2);
  return Array.from({ length }, (_, i) => ({ x: startX - i, y: midY }));
}

export default function GameScreen({ playerName, settings, onGameOver, onMenu }: Props) {
  const { boardSize, startLength, fruitDelay } = settings;

  const [snake, setSnake] = useState<Position[]>(() =>
    buildInitialSnake(boardSize, startLength)
  );
  const [food, setFood] = useState<Position | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [fruitCountdown, setFruitCountdown] = useState<number | null>(null);

  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const snakeRef = useRef<Position[]>(snake);
  const foodRef = useRef<Position | null>(null);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const fruitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  snakeRef.current = snake;
  foodRef.current = food;
  scoreRef.current = score;

  useEffect(() => {
    getBestScore(playerName).then(setBestScore);
    spawnFood(buildInitialSnake(boardSize, startLength));
    return () => clearTimers();
  }, []);

  function clearTimers() {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (fruitTimerRef.current) clearTimeout(fruitTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
  }

  function spawnFood(currentSnake: Position[]) {
    if (fruitTimerRef.current) clearTimeout(fruitTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    const pos = randomPosition(boardSize, currentSnake);
    setFood(pos);
    foodRef.current = pos;
    setFruitCountdown(null);
  }

  function startFruitTimer(currentSnake: Position[]) {
    if (fruitTimerRef.current) clearTimeout(fruitTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);

    let remaining = fruitDelay;
    setFruitCountdown(remaining);

    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setFruitCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
      }
    }, 1000);

    fruitTimerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setFruitCountdown(null);
      spawnFood(snakeRef.current);
    }, fruitDelay * 1000);
  }

  useEffect(() => {
    if (gameOver) return;
    gameLoopRef.current = setInterval(tick, 150);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver]);

  // keyboard controls for web
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function onKey(e: KeyboardEvent) {
      if (gameOverRef.current) return;
      const cur = nextDirectionRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w') && cur !== 'DOWN') nextDirectionRef.current = 'UP';
      else if ((e.key === 'ArrowDown' || e.key === 's') && cur !== 'UP') nextDirectionRef.current = 'DOWN';
      else if ((e.key === 'ArrowLeft' || e.key === 'a') && cur !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      else if ((e.key === 'ArrowRight' || e.key === 'd') && cur !== 'LEFT') nextDirectionRef.current = 'RIGHT';
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const tick = useCallback(() => {
    if (gameOverRef.current) return;

    directionRef.current = nextDirectionRef.current;
    const dir = directionRef.current;
    const prev = snakeRef.current;
    const head = prev[0];

    let nx = head.x;
    let ny = head.y;
    if (dir === 'UP') ny -= 1;
    else if (dir === 'DOWN') ny += 1;
    else if (dir === 'LEFT') nx -= 1;
    else if (dir === 'RIGHT') nx += 1;

    const newHead: Position = { x: nx, y: ny };

    // collision with wall or self
    if (
      nx < 0 || nx >= boardSize || ny < 0 || ny >= boardSize ||
      prev.some((p) => p.x === newHead.x && p.y === newHead.y)
    ) {
      gameOverRef.current = true;
      setGameOver(true);
      clearTimers();
      const finalScore = scoreRef.current;
      saveScore(playerName, finalScore).then(() => {
        getBestScore(playerName).then(setBestScore);
      });
      onGameOver(finalScore);
      return;
    }

    const ate = foodRef.current &&
      foodRef.current.x === newHead.x &&
      foodRef.current.y === newHead.y;

    let newSnake: Position[];
    if (ate) {
      newSnake = [newHead, ...prev];
      foodRef.current = null;
      setFood(null);
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      startFruitTimer(newSnake);
    } else {
      newSnake = [newHead, ...prev.slice(0, -1)];
    }

    snakeRef.current = newSnake;
    setSnake([...newSnake]);
  }, [boardSize, playerName, fruitDelay, onGameOver]);

  function handlePress(event: GestureResponderEvent) {
    if (gameOverRef.current) return;
    const { locationX, locationY } = event.nativeEvent;
    const cx = boardRef.current.width / 2;
    const cy = boardRef.current.height / 2;
    const dx = locationX - cx;
    const dy = locationY - cy;
    const cur = directionRef.current;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0 && cur !== 'LEFT') nextDirectionRef.current = 'RIGHT';
      else if (dx < 0 && cur !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    } else {
      if (dy > 0 && cur !== 'UP') nextDirectionRef.current = 'DOWN';
      else if (dy < 0 && cur !== 'DOWN') nextDirectionRef.current = 'UP';
    }
  }

  const boardRef = useRef<{ width: number; height: number; x: number; y: number }>({
    width: 300,
    height: 300,
    x: 0,
    y: 0,
  });

  const GAME_SIZE = 320;
  const cellSize = GAME_SIZE / boardSize;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>WYNIK</Text>
          <Text style={styles.scoreValue}>{score}</Text>
        </View>
        <View style={styles.titleBox}>
          <Text style={styles.playerName}>{playerName}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>REKORD</Text>
          <Text style={styles.scoreValue}>{Math.max(bestScore, score)}</Text>
        </View>
      </View>

      {/* Fruit countdown */}
      <View style={styles.countdownRow}>
        {food === null && fruitCountdown !== null && (
          <Text style={styles.countdownText}>
            Następny owocek za: <Text style={styles.countdownNum}>{fruitCountdown}s</Text>
          </Text>
        )}
        {food !== null && (
          <Text style={styles.countdownText}>🍎 Zjedz owocek!</Text>
        )}
      </View>

      {/* Board */}
      <Pressable onPress={handlePress}>
        <View
          style={[styles.board, { width: GAME_SIZE, height: GAME_SIZE }]}
          onLayout={(e) => {
            boardRef.current = {
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height,
              x: e.nativeEvent.layout.x,
              y: e.nativeEvent.layout.y,
            };
          }}
        >
          {/* Grid lines */}
          {Array.from({ length: boardSize }).map((_, row) =>
            Array.from({ length: boardSize }).map((_, col) => (
              <View
                key={`cell-${row}-${col}`}
                style={[
                  styles.cell,
                  {
                    left: col * cellSize,
                    top: row * cellSize,
                    width: cellSize,
                    height: cellSize,
                  },
                ]}
              />
            ))
          )}

          {/* Food */}
          {food && (
            <View
              style={[
                styles.food,
                {
                  left: food.x * cellSize + 1,
                  top: food.y * cellSize + 1,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  borderRadius: (cellSize - 2) / 2,
                },
              ]}
            />
          )}

          {/* Snake */}
          {snake.map((seg, i) => (
            <View
              key={`seg-${i}`}
              style={[
                i === 0 ? styles.snakeHead : styles.snakeBody,
                {
                  left: seg.x * cellSize + 1,
                  top: seg.y * cellSize + 1,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  borderRadius: i === 0 ? (cellSize - 2) / 4 : (cellSize - 2) / 6,
                },
              ]}
            />
          ))}

          {/* Game Over overlay */}
          {gameOver && (
            <View style={styles.overlay}>
              <Text style={styles.gameOverTitle}>KONIEC GRY</Text>
              <Text style={styles.gameOverScore}>Wynik: {score}</Text>
              <Text style={styles.gameOverBtn} onPress={onMenu}>
                Wróć do menu
              </Text>
            </View>
          )}
        </View>
      </Pressable>

      {/* Controls hint */}
      <Text style={styles.hint}>
        {Platform.OS === 'web'
          ? 'Strzałki / WASD lub kliknij planszę w kierunku ruchu'
          : 'Tapnij w kierunku, w którym wąż ma się ruszyć'}
      </Text>

      <Text style={styles.menuLink} onPress={onMenu}>
        ← Menu
      </Text>
    </View>
  );
}

const DARK_BG = '#0d1117';
const BOARD_BG = '#161b22';
const GRID_LINE = '#21262d';
const SNAKE_HEAD = '#39d353';
const SNAKE_BODY = '#26a641';
const FOOD_COLOR = '#ff6b6b';
const TEXT_COLOR = '#e6edf3';
const ACCENT = '#58a6ff';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    width: 320,
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreBox: {
    alignItems: 'center',
    minWidth: 70,
  },
  scoreLabel: {
    color: '#8b949e',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  scoreValue: {
    color: ACCENT,
    fontSize: 22,
    fontWeight: '700',
  },
  titleBox: {
    alignItems: 'center',
  },
  playerName: {
    color: SNAKE_HEAD,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countdownRow: {
    height: 24,
    marginBottom: 8,
    justifyContent: 'center',
  },
  countdownText: {
    color: '#8b949e',
    fontSize: 13,
  },
  countdownNum: {
    color: FOOD_COLOR,
    fontWeight: '700',
  },
  board: {
    backgroundColor: BOARD_BG,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: ACCENT,
    position: 'relative',
  },
  cell: {
    position: 'absolute',
    borderWidth: 0.5,
    borderColor: GRID_LINE,
  },
  snakeHead: {
    position: 'absolute',
    backgroundColor: SNAKE_HEAD,
  },
  snakeBody: {
    position: 'absolute',
    backgroundColor: SNAKE_BODY,
  },
  food: {
    position: 'absolute',
    backgroundColor: FOOD_COLOR,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,17,23,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  gameOverTitle: {
    color: FOOD_COLOR,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 12,
  },
  gameOverScore: {
    color: TEXT_COLOR,
    fontSize: 18,
    marginBottom: 24,
  },
  gameOverBtn: {
    color: ACCENT,
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: ACCENT,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  hint: {
    color: '#484f58',
    fontSize: 11,
    marginTop: 10,
    textAlign: 'center',
  },
  menuLink: {
    color: '#8b949e',
    fontSize: 13,
    marginTop: 10,
    padding: 8,
  },
});
