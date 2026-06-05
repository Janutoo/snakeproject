export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface Position {
  x: number;
  y: number;
}

export interface GameSettings {
  boardSize: number;       // cells per row/column (10–30)
  startLength: number;     // starting snake length
  fruitDelay: number;      // seconds before next fruit after eating
}

export interface PlayerScore {
  name: string;
  bestScore: number;
}

export type Screen = 'menu' | 'game' | 'settings';
