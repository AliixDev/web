// frontend/components/seller/Charts.tsx
"use client";

import { cn } from "@/lib/utils";

export interface ChartDatum {
  label: string;
  value: number;
}

interface ChartProps {
  data: ChartDatum[];
  height?: number;
  formatValue?: (value: number) => string;
  className?: string;
  ariaLabel?: string;
}

const EMPTY_LABEL = "No data";

function maxValue(data: ChartDatum[]): number {
  return Math.max(1, ...data.map((d) => d.value));
}

// ---------------------------------------------------------------------
// Vertical bar chart
// ---------------------------------------------------------------------
export function BarChart({
  data,
  height = 200,
  formatValue = (v) => String(v),
  className,
  ariaLabel = "Bar chart",
}: ChartProps) {
  const max = maxValue(data);
  const gap = data.length > 1 ? Math.max(2, Math.min(12, 240 / data.length)) : 0;
  const barWidth = data.length > 0 ? Math.max(4, (240 / data.length - gap)) : 0;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn("flex w-full items-end gap-1 border-b border-neutral-200", className)}
      style={{ height }}
    >
      {data.length === 0 ? (
        <span className="mx-auto mb-2 text-[12px] text-neutral-400">{EMPTY_LABEL}</span>
      ) : (
        data.map((d) => (
          <div
            key={d.label}
            className="group relative flex h-full flex-1 flex-col justify-end"
            style={{ maxWidth: 36 }}
          >
            <div
              className="w-full bg-foreground transition-colors duration-200 group-hover:bg-neutral-500"
              style={{ height: `${Math.max(2, (d.value / max) * 100)}%` }}
              title={`${d.label}: ${formatValue(d.value)}`}
            />
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Line chart (SVG)
// ---------------------------------------------------------------------
export function LineChart({
  data,
  height = 200,
  formatValue = (v) => String(v),
  className,
  ariaLabel = "Line chart",
}: ChartProps) {
  const width = 640;
  const pad = 8;
  const max = maxValue(data);
  const maxIndex = data.length - 1;

  const points = data.map((d, i) => ({
    x: data.length <= 1 ? width / 2 : pad + (i * (width - pad * 2)) / maxIndex,
    y: height - pad - ((d.value / max) * (height - pad * 2)),
    ...d,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  return (
    <div className={cn("w-full", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={ariaLabel}
        className="w-full"
        preserveAspectRatio="none"
      >
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={width}
            y1={height * f}
            y2={height * f}
            stroke="hsl(var(--neutral-200))"
            strokeWidth={1}
            strokeDasharray="3 4"
          />
        ))}
        {data.length > 0 && (
          <path d={linePath} fill="none" stroke="hsl(var(--foreground))" strokeWidth={2} strokeLinejoin="round" />
        )}
        {points.map((p) => (
          <circle key={p.label} cx={p.x} cy={p.y} r={3} fill="hsl(var(--background))" stroke="hsl(var(--foreground))" strokeWidth={1.5}>
            <title>{`${p.label}: ${formatValue(p.value)}`}</title>
          </circle>
        ))}
      </svg>
      {data.length > 0 && (
        <div className="mt-2 flex justify-between gap-2 overflow-hidden text-[10px] text-neutral-400">
          <span>{data[0].label}</span>
          <span>{data[data.length - 1].label}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Horizontal bar list (rankings, breakdowns)
// ---------------------------------------------------------------------
export function HBarList({
  items,
  formatValue = (v) => String(v),
  emptyLabel = EMPTY_LABEL,
}: {
  items: ChartDatum[];
  formatValue?: (value: number) => string;
  emptyLabel?: string;
}) {
  const max = maxValue(items);

  if (items.length === 0) {
    return <p className="py-8 text-center text-[12px] text-neutral-400">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-[12px]">
            <span className="truncate font-medium text-neutral-800">{item.label}</span>
            <span className="shrink-0 tabular-nums text-neutral-500">{formatValue(item.value)}</span>
          </div>
          <div className="h-1.5 w-full bg-neutral-100">
            <div
              className="h-full bg-foreground transition-all duration-500 ease-premium"
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
