import { useEffect, useRef } from 'react';

const ROUND_SECONDS = 180;
const ROUNDS = 12;

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Chronomètre de round décoratif (HUD). Purement visuel : aria-hidden, figé en reduced-motion. */
export function RoundClock({ running, className }: { running: boolean; className?: string }) {
  const round = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!running) return;
    let elapsed = 0;
    const id = window.setInterval(() => {
      elapsed += 1;
      const r = Math.floor(elapsed / ROUND_SECONDS) % ROUNDS;
      if (round.current) round.current.textContent = String(r + 1).padStart(2, '0');
      if (time.current) time.current.textContent = fmt(elapsed % ROUND_SECONDS);
    }, 1000);
    return () => window.clearInterval(id);
  }, [running]);

  return (
    <p className={className} aria-hidden="true">
      RD <span ref={round}>01</span> <span style={{ opacity: 0.4 }}>/ {ROUNDS}</span>
      <span style={{ display: 'inline-block', width: '1.5em' }} />
      <span ref={time}>00:00</span>
    </p>
  );
}
