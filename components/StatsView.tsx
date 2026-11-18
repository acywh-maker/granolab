"use client"; // 실시간으로 숫자가 바뀌어서 클라이언트 컴포넌트

import { useLiveStats } from "@/components/useLiveStats";
import { breakfastLabel, type Stats } from "@/lib/campaign";

export default function StatsView({ stats: initial }: { stats: Stats }) {
  // 새 신청 신호가 오면 → 집계 창구(숫자만)를 다시 읽어서 채널별 · 습관별 막대까지 바꾸기
  const { stats, live } = useLiveStats(initial);

  const total = stats.total;
  const left = Math.max(stats.capacity - total, 0);
  const rate = Math.round((total / stats.capacity) * 100);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-3 gap-3">
        <Card label="신청" value={`${total.toLocaleString("ko-KR")}명`} />
        <Card label="남은 자리" value={`${left.toLocaleString("ko-KR")}명`} />
        <Card label="달성률" value={`${rate}%`} />
      </div>

      <p className="flex items-center gap-1.5 text-xs text-stone-500">
        <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-500" : "bg-stone-300"}`} />
        {live ? "신청이 들어오면 자동으로 바뀌어요" : "실시간 연결 중…"}
      </p>

      <Bars
        title="채널별 신청 수 (utm_source)"
        rows={stats.by_source.map((r) => ({ label: r.source, count: r.count }))}
        total={total}
      />
      <Bars
        title="아침 식사 습관별"
        rows={stats.by_breakfast.map((r) => ({ label: breakfastLabel(r.breakfast), count: r.count }))}
        total={total}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-emerald-900/10">
      <p className="text-xs text-stone-500 sm:text-sm">{label}</p>
      <p className="mt-1 text-xl font-extrabold text-stone-900 sm:text-2xl">{value}</p>
    </div>
  );
}

function Bars({ title, rows, total }: { title: string; rows: { label: string; count: number }[]; total: number }) {
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-emerald-900/10">
      <h2 className="font-bold text-stone-800">{title}</h2>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-stone-500">아직 신청이 없어요.</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.label} className="grid grid-cols-[6.5rem_1fr_4.5rem] items-center gap-3 text-sm">
              <span className="truncate font-medium text-stone-700" title={r.label}>
                {r.label}
              </span>
              <span className="h-3 overflow-hidden rounded-full bg-stone-100">
                <span
                  className="block h-full rounded-full bg-emerald-600 transition-all duration-700"
                  style={{ width: `${(r.count / max) * 100}%` }}
                />
              </span>
              <span className="text-right tabular-nums text-stone-600">
                {r.count}명 <span className="text-stone-400">{total ? Math.round((r.count / total) * 100) : 0}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
