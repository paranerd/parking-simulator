export const eur = (n: number): string => {
  if (!Number.isFinite(n)) return '∞';
  if (Math.abs(n) >= 1e9)
    return (n / 1e9).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' Mrd';
  if (Math.abs(n) >= 1e6)
    return (n / 1e6).toLocaleString('de-DE', { maximumFractionDigits: 2 }) + ' Mio';
  return n.toLocaleString('de-DE', {
    maximumFractionDigits: Math.abs(n) < 100 ? 2 : 0,
  });
};

export const zahl = (n: number, stellen = 0): string =>
  n.toLocaleString('de-DE', { maximumFractionDigits: stellen });

export const dauer = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sek = Math.floor(s % 60);
  return `${h}:${String(m).padStart(2, '0')}:${String(sek).padStart(2, '0')}`;
};

export const prozent = (n: number): string => `${Math.round(n * 100)}%`;
