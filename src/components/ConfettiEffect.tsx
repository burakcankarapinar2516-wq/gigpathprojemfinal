import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useStore } from '../store';
import { playCoinSound } from '../lib/audio';

export function ConfettiEffect() {
  const lastPaidInvoiceId = useStore(state => state.lastPaidInvoiceId);
  const clearPaidTrigger = useStore(state => state.clearPaidTrigger);

  useEffect(() => {
    if (lastPaidInvoiceId) {
      playCoinSound();
      
      const count = 200;
      const defaults = {
        origin: { y: -0.1 },
        colors: ['#FFD700', '#FFA500', '#F8E71C'] // Gold shades
      };

      function fire(particleRatio: number, opts: any) {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      }

      fire(0.25, { spread: 26, startVelocity: 55 });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 120, startVelocity: 45 });

      clearPaidTrigger();
    }
  }, [lastPaidInvoiceId, clearPaidTrigger]);

  return null;
}
