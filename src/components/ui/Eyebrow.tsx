import type { ReactNode } from 'react';

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="ps-eyebrow">{children}</div>;
}
