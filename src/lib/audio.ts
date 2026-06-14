// Mario-like coin sound effect using Web Audio API
export const playCoinSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  
  const ctx = new AudioContext();
  
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Mario coin sound characteristics:
  // Quick slide up in pitch, square wave for that 8-bit feel
  osc.type = 'square';
  
  const now = ctx.currentTime;
  
  // Start Note (roughly B5)
  osc.frequency.setValueAtTime(987.77, now);
  
  // Slide to E6 very quickly
  osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.1);
  
  // Envelope
  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
  
  osc.start(now);
  osc.stop(now + 0.3);
};
