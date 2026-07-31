import type { ReactNode } from 'react';

interface Props {
  onClick: () => void;
  children: ReactNode;
  preis?: string;
  disabled?: boolean;
  variante?: 'haupt' | 'geist';
}

export function Knopf({ onClick, children, preis, disabled, variante }: Props) {
  const klassen = ['ps-knopf', variante ? `ps-knopf--${variante}` : '']
    .filter(Boolean)
    .join(' ');
  return (
    <button className={klassen} onClick={onClick} disabled={disabled}>
      <span>{children}</span>
      {preis && <span className="ps-knopf__preis">{preis}</span>}
    </button>
  );
}
