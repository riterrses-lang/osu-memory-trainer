export class AudioClock {
  private audioContext: AudioContext | null = null;
  private startTime: number = 0;
  private pausedAt: number = 0;
  private isRunning: boolean = false;
  
  init() {
    if (!this.audioContext) {
      this.audioContext = new AudioContext();
    }
  }
  
  start() {
    if (!this.audioContext) this.init();
    this.startTime = this.audioContext!.currentTime * 1000 - this.pausedAt;
    this.isRunning = true;
  }
  
  pause() {
    if (this.isRunning) {
      this.pausedAt = this.getTime();
      this.isRunning = false;
    }
  }
  
  resume() {
    if (!this.isRunning && this.pausedAt > 0) {
      this.startTime = this.audioContext!.currentTime * 1000 - this.pausedAt;
      this.isRunning = true;
    }
  }
  
  getTime(): number {
    if (!this.isRunning) return this.pausedAt;
    return this.audioContext!.currentTime * 1000 - this.startTime;
  }
  
  // Точный таймаут, синхронизированный с аудио
  scheduleCallback(time: number, callback: () => void): number {
    const delay = Math.max(0, time - this.getTime());
    return window.setTimeout(callback, delay);
  }
}

export const audioClock = new AudioClock();
