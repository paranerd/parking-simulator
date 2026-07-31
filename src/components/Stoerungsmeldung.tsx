import { eur } from '../game/format';
import type { Kennzahlen } from '../game/types';
import { Panel } from './ui/Panel';
import { Knopf } from './ui/Knopf';

interface Props {
  k: Kennzahlen;
  geld: number;
  onReparieren: (kosten: number) => void;
}

export function Stoerungsmeldung({ k, geld, onReparieren }: Props) {
  if (!k.stoerung) return null;
  const kosten = k.umsatz * 40;

  return (
    <Panel variante="warnung">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div>
          <div className="ps-eyebrow">Störung</div>
          <div style={{ fontSize: 14 }}>{k.stoerung.text}</div>
        </div>
        <Knopf
          variante="haupt"
          disabled={geld < kosten}
          onClick={() => onReparieren(kosten)}
          preis={`${eur(kosten)} €`}
        >
          Reparieren
        </Knopf>
      </div>
    </Panel>
  );
}
