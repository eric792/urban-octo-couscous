import { formatZAR } from "@/lib/utils";

// Single-series column chart: daily paid revenue. Validated bar colour on the
// dark admin surface (lightness band, chroma floor, ≥3:1 contrast).
const BAR = "#B58A30";

function niceMax(value: number): number {
  if (value <= 0) return 1000;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function compact(value: number): string {
  if (value >= 1000) return `R${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}K`;
  return `R${value}`;
}

function dayLabel(day: string): string {
  return new Date(`${day}T12:00:00Z`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function RevenueChart({ data }: { data: { day: string; revenue: number; orders: number }[] }) {
  const max = niceMax(Math.max(...data.map((d) => d.revenue)));
  const peak = data.reduce((best, d) => (d.revenue > best.revenue ? d : best), data[0]);
  const ticks = [max, max / 2, 0];

  return (
    <figure>
      <div className="relative flex h-56 gap-3">
        {/* y-axis */}
        <div className="flex w-10 shrink-0 flex-col justify-between text-right text-[11px] text-zinc-500">
          {ticks.map((t) => (
            <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{compact(t)}</span>
          ))}
        </div>
        <div className="relative flex-1">
          {/* hairline grid */}
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 h-px bg-zinc-800" style={{ top: `${(1 - t / max) * 100}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end justify-between gap-0.5">
            {data.map((d) => {
              const pct = (d.revenue / max) * 100;
              return (
                <div key={d.day} className="group relative flex h-full flex-1 items-end justify-center">
                  {/* hit target is the full column, bigger than the bar */}
                  <div className="absolute inset-0 rounded-sm group-hover:bg-white/[0.03]" />
                  {d.day === peak.day && d.revenue > 0 && (
                    <span className="absolute text-[10px] text-zinc-300" style={{ bottom: `calc(${pct}% + 4px)` }}>
                      {compact(Math.round(d.revenue))}
                    </span>
                  )}
                  <div
                    className="relative w-full max-w-6 rounded-t-[4px]"
                    style={{ height: `${Math.max(pct, d.revenue > 0 ? 1.5 : 0)}%`, background: BAR }}
                  />
                  <div className="pointer-events-none absolute bottom-full z-10 mb-2 hidden whitespace-nowrap rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs shadow-xl group-hover:block">
                    <p className="text-zinc-400">{dayLabel(d.day)}</p>
                    <p className="font-medium text-white">{formatZAR(d.revenue)}</p>
                    <p className="text-zinc-500">{d.orders} {d.orders === 1 ? "order" : "orders"}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="ml-[52px] mt-2 flex justify-between text-[11px] text-zinc-500">
        {data.map((d, i) => (
          <span key={d.day} className="flex-1 text-center">{i % 3 === 0 || i === data.length - 1 ? dayLabel(d.day) : ""}</span>
        ))}
      </div>
      <details className="mt-4 text-xs text-zinc-500">
        <summary className="cursor-pointer hover:text-zinc-300">View as table</summary>
        <table className="mt-3 w-full text-left">
          <thead>
            <tr className="text-zinc-500"><th className="py-1">Day</th><th>Orders</th><th className="text-right">Revenue</th></tr>
          </thead>
          <tbody className="text-zinc-300">
            {data.map((d) => (
              <tr key={d.day} className="border-t border-zinc-800"><td className="py-1">{dayLabel(d.day)}</td><td>{d.orders}</td><td className="text-right">{formatZAR(d.revenue)}</td></tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
