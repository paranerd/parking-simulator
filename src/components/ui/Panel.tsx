import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  variante?: 'kompakt' | 'warnung';
  className?: string;
}

export function Panel({ children, variante, className }: Props) {
  const klassen = [
    'ps-panel',
    variante ? `ps-panel--${variante}` : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');
  return <div className={klassen}>{children}</div>;
}
