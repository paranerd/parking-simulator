interface Props {
  label: string;
  wert: number;
  min: number;
  max: number;
  step: number;
  einheit?: string;
  onChange: (wert: number) => void;
}

export function Regler({ label, wert, min, max, step, einheit, onChange }: Props) {
  return (
    <div className="ps-regler">
      <div className="ps-regler__kopf">
        <span className="ps-eyebrow">{label}</span>
        <span className="ps-regler__wert">
          {wert.toLocaleString('de-DE', { maximumFractionDigits: 3 })}
          {einheit ?? ''}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={wert}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}
