"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  addDays,
  currency,
  dayLabel,
  num,
  shortNum,
} from "@/lib/format";
import {
  fill,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";
import { METRICS, type DailyPoint, type MetricKey } from "@/lib/metrics";

const INITIAL_WIDTH = 760;

function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 1;
  const power = 10 ** Math.floor(Math.log10(value));
  const fraction = value / power;
  const nice =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
}

function buildSeries(
  points: DailyPoint[],
  start: string,
  end: string,
): DailyPoint[] {
  if (!start || !end) return points;
  const byDate = new Map(points.map((point) => [point.date, point]));
  const out: DailyPoint[] = [];
  let cursor = start;
  let guard = 0;

  while (cursor <= end && guard < 400) {
    out.push(
      byDate.get(cursor) ?? {
        date: cursor,
        orders: 0,
        shipped: 0,
        sales: 0,
        shippedSales: 0,
        earnings: 0,
        clicks: 0,
      },
    );
    cursor = addDays(cursor, 1);
    guard += 1;
  }

  return out;
}

type Tip = { left: number; top: number; text: string };

export function PerformanceChart({
  points,
  start,
  end,
  dict,
  locale,
}: {
  points: DailyPoint[];
  start: string;
  end: string;
  dict: Dictionary;
  locale: Locale;
}) {
  const [metric, setMetric] = useState<MetricKey>("earnings");
  const [tip, setTip] = useState<Tip | null>(null);
  const [width, setWidth] = useState(INITIAL_WIDTH);
  const boxRef = useRef<HTMLDivElement>(null);

  const series = useMemo(
    () => buildSeries(points, start, end),
    [points, start, end],
  );

  useEffect(() => {
    const node = boxRef.current;
    if (!node) return;

    const update = () => {
      const next = Math.round(node.clientWidth);
      if (next > 0) setWidth(next);
    };

    update();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }

    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const definition = METRICS.find((item) => item.key === metric) ?? METRICS[0];

  if (series.length === 0) {
    return (
      <section className="card">
        <h2>{dict.chart.title}</h2>
        <p className="empty">{dict.chart.empty}</p>
      </section>
    );
  }

  const W = Math.max(280, width);
  const H = W < 520 ? 200 : 240;
  const rtl = locale === "ar";
  const axis = W < 520 ? 44 : 56;
  const L = rtl ? 8 : axis;
  const R = rtl ? axis : 8;
  const T = 12;
  const B = 26;

  const values = series.map((point) => point[metric]);
  const maxValue = Math.max(...values, 1);
  const step = niceStep(maxValue / 4);
  const top = Math.max(Math.ceil(maxValue / step) * step, 1);
  const pw = W - L - R;
  const ph = H - T - B;
  const slot = pw / series.length;
  const barWidth = Math.max(2, Math.min(28, slot - 2));
  const every = Math.max(
    1,
    Math.ceil(series.length / Math.max(4, Math.floor(pw / 48))),
  );

  const y = (value: number) => T + ph - (value / top) * ph;
  const barX = (index: number) =>
    rtl
      ? L + pw - (index + 1) * slot + (slot - barWidth) / 2
      : L + index * slot + (slot - barWidth) / 2;
  const slotX = (index: number) =>
    rtl ? L + pw - (index + 1) * slot : L + index * slot;

  const ticks: number[] = [];
  for (let value = 0; value <= top + step / 2; value += step) {
    ticks.push(value);
  }

  function showTip(
    event: React.MouseEvent<SVGRectElement>,
    index: number,
  ) {
    const box = boxRef.current?.getBoundingClientRect();
    if (!box) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const point = series[index];
    const value = point[metric];
    const rawLeft = rect.left + rect.width / 2 - box.left;
    const edge = Math.min(72, box.width / 2);

    setTip({
      left: Math.max(edge, Math.min(box.width - edge, rawLeft)),
      top: (y(value) / H) * box.height,
      text: fill(dict.chart.tooltip, {
        date: dayLabel(point.date, locale),
        value: `${num(value)}${
          definition.money ? ` ${currency(locale)}` : ""
        }`,
      }),
    });
  }

  return (
    <section className="card">
      <div className="chart-head">
        <h2>{dict.chart.title}</h2>
        <select
          value={metric}
          onChange={(event) => {
            setMetric(event.target.value as MetricKey);
            setTip(null);
          }}
          aria-label={dict.chart.metricAria}
        >
          {METRICS.map((item) => (
            <option key={item.key} value={item.key}>
              {dict.metrics[item.key]}
            </option>
          ))}
        </select>
      </div>

      <div className="chart" ref={boxRef} onMouseLeave={() => setTip(null)}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${dict.metrics[metric]} — ${dict.chart.title}`}
        >
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                x1={L}
                x2={W - R}
                y1={y(tick)}
                y2={y(tick)}
                stroke="var(--grid)"
                strokeWidth={1}
              />
              <text
                x={rtl ? W - R + 6 : L - 6}
                y={y(tick) + 4}
                textAnchor={rtl ? "start" : "end"}
              >
                {shortNum(tick)}
              </text>
            </g>
          ))}

          {series.map((point, index) => {
            const value = point[metric];
            const x = barX(index);
            const height = Math.max(value > 0 ? 2 : 0, T + ph - y(value));
            const radius = Math.min(4, barWidth / 2, height);

            return (
              <g key={point.date}>
                {height > 0 ? (
                  <path
                    className="bar"
                    fill="var(--bar)"
                    d={`M${x},${T + ph}V${T + ph - height + radius}q0,-${radius} ${radius},-${radius}H${
                      x + barWidth - radius
                    }q${radius},0 ${radius},${radius}V${T + ph}Z`}
                  />
                ) : null}
                <rect
                  x={slotX(index)}
                  y={T}
                  width={slot}
                  height={ph}
                  fill="transparent"
                  onMouseMove={(event) => showTip(event, index)}
                  onClick={(event) => showTip(event, index)}
                />
              </g>
            );
          })}

          <line
            x1={L}
            x2={W - R}
            y1={T + ph}
            y2={T + ph}
            stroke="var(--line)"
            strokeWidth={1}
          />

          {series.map((point, index) =>
            index % every === 0 ? (
              <text
                key={`label-${point.date}`}
                x={barX(index) + barWidth / 2}
                y={H - 8}
                textAnchor="middle"
              >
                {Number(point.date.slice(8, 10))}
              </text>
            ) : null,
          )}
        </svg>

        {tip ? (
          <div
            className="tip"
            style={{ left: tip.left, top: tip.top }}
            role="status"
          >
            {tip.text}
          </div>
        ) : null}
      </div>
    </section>
  );
}
