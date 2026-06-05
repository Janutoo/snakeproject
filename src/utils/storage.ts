import AsyncStorage from '@react-native-async-storage/async-storage';
import { PlayerScore, GameSettings } from './types';

const SCORES_KEY = 'snake_scores';
const SETTINGS_KEY = 'snake_settings';

export const DEFAULT_SETTINGS: GameSettings = {
  boardSize: 20,
  startLength: 5,
  fruitDelay: 10,
};

export async function loadScores(): Promise<PlayerScore[]> {
  try {
    const raw = await AsyncStorage.getItem(SCORES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveScore(name: string, score: number): Promise<void> {
  try {
    const scores = await loadScores();
    const idx = scores.findIndex((s) => s.name === name);
    if (idx >= 0) {
      if (score > scores[idx].bestScore) scores[idx].bestScore = score;
    } else {
      scores.push({ name, bestScore: score });
    }
    await AsyncStorage.setItem(SCORES_KEY, JSON.stringify(scores));
  } catch {}
}

export async function getBestScore(name: string): Promise<number> {
  const scores = await loadScores();
  return scores.find((s) => s.name === name)?.bestScore ?? 0;
}

export async function loadSettings(): Promise<GameSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
