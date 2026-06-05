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
  const [bonusFood, setBonusFood] = useState<Position | null>(null);
  const [score, setScore] = useState(0);
  const [bestScore, setBestScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [fruitCountdown, setFruitCountdown] = useState<number | null>(null);
  const [bonusCountdown, setBonusCountdown] = useState<number | null>(null);

  const directionRef = useRef<Direction>('RIGHT');
  const nextDirectionRef = useRef<Direction>('RIGHT');
  const snakeRef = useRef<Position[]>(snake);
  const foodRef = useRef<Position | null>(null);
  const bonusFoodRef = useRef<Position | null>(null);
  const scoreRef = useRef(0);
  const gameOverRef = useRef(false);
  const pausedRef = useRef(false);
  const fruitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bonusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bonusCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const gameLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  snakeRef.current = snake;
  foodRef.current = food;
  bonusFoodRef.current = bonusFood;
  scoreRef.current = score;
  pausedRef.current = paused;

  const speed = Math.max(80, 200 - Math.floor(score / 5) * 15);
  const level = Math.floor(score / 5) + 1;

  useEffect(() => {
    getBestScore(playerName).then(setBestScore);
    spawnFood(buildInitialSnake(boardSize, startLength));
    return () => clearTimers();
  }, []);

  function clearTimers() {
    if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    if (fruitTimerRef.current) clearTimeout(fruitTimerRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    if (bonusCountdownRef.current) clearInterval(bonusCountdownRef.current);
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
      if (remaining <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    }, 1000);

    fruitTimerRef.current = setTimeout(() => {
      if (countdownRef.current) clearInterval(countdownRef.current);
      setFruitCountdown(null);
      spawnFood(snakeRef.current);
    }, fruitDelay * 1000);
  }

  function spawnBonusFood(currentSnake: Position[]) {
    if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
    if (bonusCountdownRef.current) clearInterval(bonusCountdownRef.current);
    const excluded = [...currentSnake];
    if (foodRef.current) excluded.push(foodRef.current);
    const pos = randomPosition(boardSize, excluded);
    setBonusFood(pos);
    bonusFoodRef.current = pos;

    let remaining = 6;
    setBonusCountdown(remaining);
    bonusCountdownRef.current = setInterval(() => {
      remaining -= 1;
      setBonusCountdown(remaining);
      if (remaining <= 0 && bonusCountdownRef.current) clearInterval(bonusCountdownRef.current);
    }, 1000);

    bonusTimerRef.current = setTimeout(() => {
      if (bonusCountdownRef.current) clearInterval(bonusCountdownRef.current);
      setBonusFood(null);
      bonusFoodRef.current = null;
      setBonusCountdown(null);
    }, 6000);
  }

  useEffect(() => {
    if (gameOver || paused) return;
    gameLoopRef.current = setInterval(tick, speed);
    return () => {
      if (gameLoopRef.current) clearInterval(gameLoopRef.current);
    };
  }, [gameOver, paused, speed]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    function onKey(e: KeyboardEvent) {
      if (gameOverRef.current) return;
      if (e.key === ' ') { togglePause(); return; }
      if (pausedRef.current) return;
      const cur = nextDirectionRef.current;
      if ((e.key === 'ArrowUp' || e.key === 'w') && cur !== 'DOWN') nextDirectionRef.current = 'UP';
      else if ((e.key === 'ArrowDown' || e.key === 's') && cur !== 'UP') nextDirectionRef.current = 'DOWN';
      else if ((e.key === 'ArrowLeft' || e.key === 'a') && cur !== 'RIGHT') nextDirectionRef.current = 'LEFT';
      else if ((e.key === 'ArrowRight' || e.key === 'd') && cur !== 'LEFT') nextDirectionRef.current = 'RIGHT';
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function togglePause() {
    if (gameOverRef.current) return;
    setPaused(p => !p);
  }

  const tick = useCallback(() => {
    if (gameOverRef.current || pausedRef.current) return;

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

    const ateBonus = bonusFoodRef.current &&
      bonusFoodRef.current.x === newHead.x &&
      bonusFoodRef.current.y === newHead.y;

    let newSnake: Position[];

    if (ate) {
      newSnake = [newHead, ...prev];
      foodRef.current = null;
      setFood(null);
      const newScore = scoreRef.current + 1;
      scoreRef.current = newScore;
      setScore(newScore);
      startFruitTimer(newSnake);
      if (!bonusFoodRef.current && Math.random() < 0.4) {
        spawnBonusFood(newSnake);
      }
    } else if (ateBonus) {
      newSnake = [newHead, ...prev];
      if (bonusTimerRef.current) clearTimeout(bonusTimerRef.current);
      if (bonusCountdownRef.current) clearInterval(bonusCountdownRef.current);
      bonusFoodRef.current = null;
      setBonusFood(null);
      setBonusCountdown(null);
      const newScore = scoreRef.current + 3;
      scoreRef.current = newScore;
      setScore(newScore);
    } else {
      newSnake = [newHead, ...prev.slice(0, -1)];
    }

    snakeRef.current = newSnake;
    setSnake([...newSnake]);
  }, [boardSize, playerName, fruitDelay, onGameOver]);

  function handlePress(event: GestureResponderEvent) {
    if (gameOverRef.current) return;
    if (pausedRef.current) { togglePause(); return; }
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

  function pressDir(dir: Direction) {
    if (gameOverRef.current || pausedRef.current) return;
    const cur = nextDirectionRef.current;
    if (dir === 'UP' && cur !== 'DOWN') nextDirectionRef.current = 'UP';
    else if (dir === 'DOWN' && cur !== 'UP') nextDirectionRef.current = 'DOWN';
    else if (dir === 'LEFT' && cur !== 'RIGHT') nextDirectionRef.current = 'LEFT';
    else if (dir === 'RIGHT' && cur !== 'LEFT') nextDirectionRef.current = 'RIGHT';
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
          <Text style={styles.levelText}>Poziom {level}</Text>
        </View>
        <View style={styles.scoreBox}>
          <Text style={styles.scoreLabel}>REKORD</Text>
          <Text style={styles.scoreValue}>{Math.max(bestScore, score)}</Text>
        </View>
      </View>

      {/* Info row */}
      <View style={styles.countdownRow}>
        {bonusFood !== null && bonusCountdown !== null && (
          <Text style={styles.bonusText}>
            ⭐ Złote jabłko! <Text style={styles.bonusNum}>{bonusCountdown}s</Text>
          </Text>
        )}
        {bonusFood === null && food === null && fruitCountdown !== null && (
          <Text style={styles.countdownText}>
            Następny owocek za: <Text style={styles.countdownNum}>{fruitCountdown}s</Text>
          </Text>
        )}
        {bonusFood === null && food !== null && (
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

          {bonusFood && (
            <View
              style={[
                styles.bonusFoodView,
                {
                  left: bonusFood.x * cellSize + 1,
                  top: bonusFood.y * cellSize + 1,
                  width: cellSize - 2,
                  height: cellSize - 2,
                  borderRadius: (cellSize - 2) / 2,
                },
              ]}
            />
          )}

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

          {paused && !gameOver && (
            <View style={styles.overlay}>
              <Text style={styles.pauseTitle}>PAUZA</Text>
              <Text style={styles.pauseHint}>Naciśnij ⏸ aby wznowić</Text>
            </View>
          )}

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

      {/* Pause button web */}
      {Platform.OS === 'web' && !gameOver && (
        <Pressable style={styles.pauseBtn} onPress={togglePause}>
          <Text style={styles.pauseBtnText}>{paused ? '▶ Wznów' : '⏸ Pauza'}</Text>
        </Pressable>
      )}

      {/* D-pad + pause mobile */}
      {Platform.OS !== 'web' && (
        <>
          <Pressable style={styles.pauseBtn} onPress={togglePause}>
            <Text style={styles.pauseBtnText}>{paused ? '▶' : '⏸'}</Text>
          </Pressable>
          <View style={styles.dpad}>
            <View style={styles.dpadRow}>
              <Pressable style={styles.dpadBtn} onPress={() => pressDir('UP')}>
                <Text style={styles.dpadArrow}>▲</Text>
              </Pressable>
            </View>
            <View style={styles.dpadRow}>
              <Pressable style={styles.dpadBtn} onPress={() => pressDir('LEFT')}>
                <Text style={styles.dpadArrow}>◀</Text>
              </Pressable>
              <View style={styles.dpadCenter} />
              <Pressable style={styles.dpadBtn} onPress={() => pressDir('RIGHT')}>
                <Text style={styles.dpadArrow}>▶</Text>
              </Pressable>
            </View>
            <View style={styles.dpadRow}>
              <Pressable style={styles.dpadBtn} onPress={() => pressDir('DOWN')}>
                <Text style={styles.dpadArrow}>▼</Text>
              </Pressable>
            </View>
          </View>
        </>
      )}

      <Text style={styles.hint}>
        {Platform.OS === 'web'
          ? 'Strzałki / WASD • Spacja = pauza'
          : 'Użyj strzałek lub tapnij planszę'}
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
const BONUS_COLOR = '#ffd700';
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
  levelText: {
    color: BONUS_COLOR,
    fontSize: 11,
    fontWeight: '600',
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
  bonusText: {
    color: BONUS_COLOR,
    fontSize: 13,
    fontWeight: '700',
  },
  bonusNum: {
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
  bonusFoodView: {
    position: 'absolute',
    backgroundColor: BONUS_COLOR,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(13,17,23,0.88)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  pauseTitle: {
    color: BONUS_COLOR,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 3,
    marginBottom: 8,
  },
  pauseHint: {
    color: TEXT_COLOR,
    fontSize: 14,
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
  pauseBtn: {
    marginTop: 10,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#21262d',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  pauseBtnText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
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
  dpad: {
    marginTop: 16,
    alignItems: 'center',
  },
  dpadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dpadBtn: {
    width: 60,
    height: 60,
    backgroundColor: '#21262d',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#30363d',
  },
  dpadArrow: {
    color: ACCENT,
    fontSize: 22,
  },
  dpadCenter: {
    width: 60,
    height: 60,
    margin: 4,
  },
});
