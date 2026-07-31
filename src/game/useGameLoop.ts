import { useEffect, useRef } from 'react';
import type { Config, State } from './types';
import { tick } from './economy';

const TICK_MS = 100;

/** Fester Tick von 10 Hz. cfg per Ref, damit der Intervall nicht neu aufgesetzt wird. */
export function useGameLoop(
  setState: React.Dispatch<React.SetStateAction<State>>,
  cfg: Config,
): void {
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => tick(prev, cfgRef.current, TICK_MS / 1000));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [setState]);
}
