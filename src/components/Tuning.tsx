import { useState } from 'react';
import { CONFIG } from '../game/config';
import type { Config } from '../game/types';
import { Panel } from './ui/Panel';
import { Knopf } from './ui/Knopf';
import { Regler } from './ui/Regler';

interface Props {
  cfg: Config;
  onChange: (cfg: Config) => void;
  onReset: () => void;
}

export function Tuning({ cfg, onChange, onReset }: Props) {
  const [offen, setOffen] = useState(false);
  const set = (patch: Partial<Config>) => onChange({ ...cfg, ...patch });

  return (
    <Panel>
      <button
        className="ps-tuning__schalter"
        onClick={() => setOffen(!offen)}
        aria-expanded={offen}
      >
        {offen ? '▾' : '▸'} Kurven justieren
      </button>

      {offen && (
        <div className="ps-tuning__gitter">
          <Regler label="Kostenwachstum r" wert={cfg.r} min={1.01} max={1.2} step={0.001} onChange={(r) => set({ r })} />
          <Regler label="Amortisation 1. Kauf" wert={cfg.tAmort} min={5} max={90} step={1} einheit=" s" onChange={(tAmort) => set({ tAmort })} />
          <Regler label="Stufensprung" wert={cfg.sprungMin} min={2} max={40} step={0.5} einheit=" min" onChange={(sprungMin) => set({ sprungMin })} />
          <Regler label="Reichweite Amortisation" wert={cfg.ezAmort} min={5} max={120} step={1} einheit=" s" onChange={(ezAmort) => set({ ezAmort })} />
          <Regler label="Reichweite Wachstum" wert={cfg.ezWachstum} min={1.1} max={2.5} step={0.01} onChange={(ezWachstum) => set({ ezWachstum })} />
          <Regler label="Preissensibilität σ" wert={cfg.streuung} min={0.2} max={2.5} step={0.05} onChange={(streuung) => set({ streuung })} />
          <Regler label="Latente Nachfrage" wert={cfg.latent} min={5} max={120} step={1} onChange={(latent) => set({ latent })} />
          <Regler label="Pacht je Ebene" wert={cfg.pacht} min={0} max={3} step={0.05} einheit=" €/s" onChange={(pacht) => set({ pacht })} />
          <Regler label="Wartung je Platz" wert={cfg.wartung} min={0} max={0.3} step={0.005} einheit=" €/s" onChange={(wartung) => set({ wartung })} />
          <Regler label="Lohn je Mitarbeiter" wert={cfg.lohn} min={0} max={5} step={0.05} einheit=" €/s" onChange={(lohn) => set({ lohn })} />
          <Regler label="Etagenmalus" wert={cfg.etagenMalus} min={1} max={1.5} step={0.01} onChange={(etagenMalus) => set({ etagenMalus })} />

          <div className="ps-tuning__aktionen">
            <Knopf onClick={() => set({ stoerungen: !cfg.stoerungen })}>
              Störungen {cfg.stoerungen ? 'an' : 'aus'}
            </Knopf>
            <Knopf onClick={() => { onChange(CONFIG); onReset(); }}>
              Zurücksetzen
            </Knopf>
          </div>
        </div>
      )}
    </Panel>
  );
}
