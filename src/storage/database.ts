import Dexie, { Table } from 'dexie';
export type PatternType = 'stream' | 'jump' | 'alternating' | 'burst' | 'aim' | 'rhythm';
export type SkillType = PatternType;

export interface PatternData {
  id?: number;
  objects: Array<{ x: number; y: number; time: number; type: 'circle' }>;
  bpm: number;
  length: number;
  difficultyParams: any;
  type?: PatternType;
  difficulty?: number;
}

export interface SessionData {
  id?: number;
  patternId: string;
  timestamp: number;
  accuracy: number;
  maxCombo: number;
  score: number;
  hits: { perfect: number; great: number; good: number; miss: number };
  duration: number;
}

export interface SkillData {
  skill: SkillType;
  elo: number;
  history: Array<{ timestamp: number; value: number }>;
}

export class DatabaseManager {
  public db!: Dexie;
  private initialized: boolean = false;

  async init() {
    if (this.initialized) return;
    this.db = new Dexie('OsuTrainerDB');
    this.db.version(1).stores({
      patterns: '++id, type, difficulty',
      sessions: '++id, timestamp, patternId',
      'user-skills': 'skill',
    });
    await this.db.open();
    this.initialized = true;
  }

  async savePattern(pattern: PatternData): Promise<number> {
    return await this.db.table('patterns').add(pattern);
  }

  async saveSession(session: SessionData): Promise<number> {
    return await this.db.table('sessions').add(session);
  }

  async getSkillLevel(skill: SkillType): Promise<number> {
    const data = await this.db.table('user-skills').get(skill);
    return data?.elo || 1000;
  }

  async updateSkill(skill: SkillType, performance: number) {
    let data = await this.db.table('user-skills').get(skill);
    if (!data) {
      data = { skill, elo: 1000, history: [] };
    }
    // Упрощенный расчет
    data.elo += (performance > 0.5 ? 10 : -10);
    data.history.push({ timestamp: Date.now(), value: data.elo });
    await this.db.table('user-skills').put(data);
  }
}

export const dbManager = new DatabaseManager();
