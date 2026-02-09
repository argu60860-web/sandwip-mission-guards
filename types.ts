
export enum GameState {
  START = 'START',
  INSTRUCTIONS = 'INSTRUCTIONS',
  LEVEL_1 = 'LEVEL_1',
  LEVEL_2 = 'LEVEL_2',
  LEVEL_3 = 'LEVEL_3',
  RESULT = 'RESULT'
}

export interface PlayerStats {
  stamina: number;
  fear: number;
  frustration: number;
}

export interface GameMetrics {
  timeElapsed: number;
  failures: number;
  bribesTaken: number;
  survived: boolean;
}

export type LevelResult = 'SUCCESS' | 'FAILURE' | 'PENDING';
