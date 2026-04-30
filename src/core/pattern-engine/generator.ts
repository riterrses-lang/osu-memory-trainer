import { PatternData, PatternType } from '../../storage/database';

interface GenerationParams {
  type: PatternType;
  difficulty: number; // 1-10
  length: number; // количество объектов
  bpm: number;
  playfieldWidth: number;
  playfieldHeight: number;
}

export class PatternGenerator {
  private readonly PLAYFIELD_ASPECT = 4 / 3; // Стандарт Osu!
  
  generate(params: GenerationParams): PatternData {
    const { type, difficulty, length, bpm, playfieldWidth, playfieldHeight } = params;
    
    const objects = this.generateByType(type, {
      difficulty,
      length,
      bpm,
      width: playfieldWidth,
      height: playfieldHeight,
    });
    
    const avgDistance = this.calculateAvgDistance(objects);
    const streamDensity = this.calculateStreamDensity(objects, bpm);
    const jumpComplexity = this.calculateJumpComplexity(objects);
    
    return {
      objects,
      bpm,
      length: (objects.length / (bpm / 60)) * 1000, // мс
      difficultyParams: {
        avgDistance,
        streamDensity,
        jumpComplexity,
      },
    };
  }
  
  private generateByType(type: PatternType, params: any): PatternData['objects'] {
    switch (type) {
      case 'stream':
        return this.generateStream(params);
      case 'jump':
        return this.generateJumps(params);
      case 'alternating':
        return this.generateAlternating(params);
      case 'burst':
        return this.generateBursts(params);
      case 'aim':
        return this.generateAimPractice(params);
      case 'rhythm':
        return this.generateRhythm(params);
      default:
        return this.generateStream(params);
    }
  }
  
  private generateStream(params: any) {
    const { difficulty, length, bpm, width, height } = params;
    const objects = [];
    const beatInterval = 60000 / bpm; // мс между ударами
    
    // Сложность влияет на плотность и расстояние
    const spacing = this.lerp(80, 30, difficulty / 10); // расстояние между объектами
    const streamAngle = (Math.random() - 0.5) * Math.PI * 0.3; // направление стрима
    
    let x = width / 2;
    let y = height / 2;
    
    for (let i = 0; i < length; i++) {
      // Добавляем джиттер для реалистичности
      const jitter = difficulty * 2;
      x += Math.cos(streamAngle) * spacing + (Math.random() - 0.5) * jitter;
      y += Math.sin(streamAngle) * spacing + (Math.random() - 0.5) * jitter;
      
      // Границы
      x = Math.max(50, Math.min(width - 50, x));
      y = Math.max(50, Math.min(height - 50, y));
      
      objects.push({
        x,
        y,
        time: i * beatInterval * (1 - (difficulty / 20)), // Микро-ускорение при сложности
        type: 'circle' as const,
      });
    }
    
    return objects;
  }
  
  private generateJumps(params: any) {
    const { difficulty, length, bpm, width, height } = params;
    const objects = [];
    const beatInterval = 60000 / bpm;
    
    // Размер прыжков зависит от сложности
    const minJump = 100 + difficulty * 10;
    const maxJump = 200 + difficulty * 30;
    
    let x = width / 2;
    let y = height / 2;
    
    for (let i = 0; i < length; i++) {
      // Генерируем прыжок
      const angle = Math.random() * Math.PI * 2;
      const distance = minJump + Math.random() * (maxJump - minJump);
      
      x = width / 2 + Math.cos(angle) * (distance / 2);
      y = height / 2 + Math.sin(angle) * (distance / 2);
      
      // Проверка границ
      const margin = 50;
      if (x < margin || x > width - margin || y < margin || y > height - margin) {
        x = width / 2;
        y = height / 2;
      }
      
      objects.push({
        x,
        y,
        time: i * beatInterval * 2, // Jumps обычно на каждые 2 удара
        type: 'circle' as const,
      });
    }
    
    return objects;
  }
  
  private generateAlternating(params: any) {
    const { difficulty, length, bpm, width, height } = params;
    const objects = [];
    const beatInterval = 60000 / bpm;
    
    // Два фиксированных места или зоны
    const leftZone = { x: width * 0.3, y: height * 0.5 };
    const rightZone = { x: width * 0.7, y: height * 0.5 };
    
    for (let i = 0; i < length; i++) {
      const isLeft = i % 2 === 0;
      const target = isLeft ? leftZone : rightZone;
      
      // Добавляем вариацию в зависимости от сложности
      const jitter = difficulty * 3;
      
      objects.push({
        x: target.x + (Math.random() - 0.5) * jitter,
        y: target.y + (Math.random() - 0.5) * jitter,
        time: i * beatInterval,
        type: 'circle' as const,
      });
    }
    
    return objects;
  }
  
  private generateBursts(params: any) {
    const { difficulty, length, bpm, width, height } = params;
    const objects = [];
    const beatInterval = 60000 / bpm;
    
    const burstsCount = Math.floor(length / 5);
    
    for (let burst = 0; burst < burstsCount; burst++) {
      const burstStart = burst * 5;
      const centerX = 100 + Math.random() * (width - 200);
      const centerY = 100 + Math.random() * (height - 200);
      
      // 5 объектов в быстром бурсте
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        const radius = difficulty * 5 + 20;
        
        objects.push({
          x: centerX + Math.cos(angle) * radius,
          y: centerY + Math.sin(angle) * radius,
          time: (burstStart + i * 0.5) * beatInterval, // Быстрые удары внутри бурста
          type: 'circle' as const,
        });
      }
      
      // Пауза между бурстами
      objects[objects.length - 1].time += beatInterval * 2;
    }
    
    return objects;
  }
  
  private generateAimPractice(params: any) {
    const { difficulty, length, bpm, width, height } = params;
    const objects = [];
    const beatInterval = 60000 / bpm;
    
    // Создаем пути, требующие точного аима
    let x = width / 2;
    let y = height / 2;
    
    for (let i = 0; i < length; i++) {
      // Создаем плавные кривые
      const targetX = 100 + Math.random() * (width - 200);
      const targetY = 100 + Math.random() * (height - 200);
      
      // Интерполяция к цели
      const t = 0.3 + difficulty * 0.05;
      x = x + (targetX - x) * t;
      y = y + (targetY - y) * t;
      
      objects.push({
        x,
        y,
        time: i * beatInterval * (1.5 - difficulty * 0.05),
        type: 'circle' as const,
      });
    }
    
    return objects;
  }
  
  private generateRhythm(params: any) {
    const { difficulty, length, bpm, width, height } = params;
    const objects = [];
    const beatInterval = 60000 / bpm;
    
    // Сложные ритмические паттерны
    const rhythmPatterns = [
      [1, 1, 1, 1], // Четвертные
      [1, 0.5, 0.5, 1], // Синкопа
      [0.5, 0.5, 0.5, 0.5, 1, 1], // Восьмые + четверти
    ];
    
    const selectedRhythm = rhythmPatterns[Math.floor(Math.random() * rhythmPatterns.length)];
    let timeAccum = 0;
    
    for (let i = 0; i < length; i++) {
      const rhythmIndex = i % selectedRhythm.length;
      const multiplier = selectedRhythm[rhythmIndex];
      
      const x = width / 2 + Math.sin(timeAccum * 0.001) * 200;
      const y = height / 2 + Math.cos(timeAccum * 0.001) * 150;
      
      objects.push({
        x,
        y,
        time: timeAccum,
        type: 'circle' as const,
      });
      
      timeAccum += beatInterval * multiplier;
    }
    
    return objects;
  }
  
  private lerp(a: number, b: number, t: number): number {
    return a + (b - a) * Math.max(0, Math.min(1, t));
  }
  
  private calculateAvgDistance(objects: PatternData['objects']): number {
    if (objects.length < 2) return 0;
    let total = 0;
    for (let i = 1; i < objects.length; i++) {
      const dx = objects[i].x - objects[i-1].x;
      const dy = objects[i].y - objects[i-1].y;
      total += Math.sqrt(dx*dx + dy*dy);
    }
    return total / (objects.length - 1);
  }
  
  private calculateStreamDensity(objects: PatternData['objects'], bpm: number): number {
    if (objects.length < 2) return 0;
    const duration = objects[objects.length-1].time - objects[0].time;
    return objects.length / (duration / 1000); // объектов в секунду
  }
  
  private calculateJumpComplexity(objects: PatternData['objects']): number {
    if (objects.length < 3) return 0;
    let angleChanges = 0;
    for (let i = 2; i < objects.length; i++) {
      const a1 = Math.atan2(objects[i-1].y - objects[i-2].y, objects[i-1].x - objects[i-2].x);
      const a2 = Math.atan2(objects[i].y - objects[i-1].y, objects[i].x - objects[i-1].x);
      const diff = Math.abs(a2 - a1);
      if (diff > Math.PI / 4) angleChanges++;
    }
    return angleChanges / objects.length;
  }
}

export const patternGenerator = new PatternGenerator();
