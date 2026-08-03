export default function ScoreBar({ value }: { value: number }) {
  const color = value >= 65 ? "bg-up" : value >= 45 ? "bg-signal" : "bg-down";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-hairline">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="tabular w-8 text-right font-mono text-xs text-ink">{Math.round(value)}</span>
    </div>
  );
}
