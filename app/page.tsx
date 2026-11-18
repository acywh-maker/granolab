import { Suspense } from "react";
import SignupSection from "@/components/SignupSection";
import StatsSkeleton from "@/components/StatsSkeleton";
import { getNow, getStats } from "@/lib/stats";

// 주소 / — 랜딩 + 신청 (서버 컴포넌트)
// 위쪽 소개는 미리 만들어 두고, 숫자 · 폼 부분만 요청마다 DB 에서 읽어요.
export default function Home({ searchParams }: PageProps<"/">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-8 px-4 pb-16 pt-8 sm:px-6">
      {/* 헤드라인 */}
      <section className="flex flex-col gap-3 text-center">
        <p className="mx-auto w-fit rounded-full bg-emerald-100 px-3 py-1 text-sm font-semibold text-emerald-800">
          출시 전 체험단 · 선착순 100명
        </p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-stone-900 sm:text-5xl">
          🍵 말차 크런치,
          <br />
          가장 먼저 맛보세요
        </h1>
        <p className="text-lg text-stone-600">바쁜 아침, 한 그릇이면 충분해요.</p>
      </section>

      {/* 혜택 3가지 */}
      <ul className="grid grid-cols-3 gap-2 text-center text-sm">
        {[
          ["🎁", "신제품 1봉", "무료 배송"],
          ["🥄", "전용 스푼", "체험단 한정"],
          ["☕", "라떼 쿠폰", "후기 작성 시"],
        ].map(([icon, title, sub]) => (
          <li key={title} className="flex flex-col gap-1 rounded-2xl bg-white p-3 shadow-sm ring-1 ring-emerald-900/10">
            <span className="text-2xl">{icon}</span>
            <span className="font-semibold text-stone-800">{title}</span>
            <span className="text-xs text-stone-500">{sub}</span>
          </li>
        ))}
      </ul>

      {/* 남은 자리 · 신청 폼 — DB 를 읽는 동안 "불러오는 중" */}
      <Suspense fallback={<StatsSkeleton />}>
        <LiveSection searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function LiveSection({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  // 주소의 ?utm_source=instagram 같은 유입 경로 읽기 (Next.js 16: await 필요)
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : (v ?? "")).slice(0, 50);
  const utm = { source: pick(sp.utm_source), medium: pick(sp.utm_medium), campaign: pick(sp.utm_campaign) };

  const [stats, now] = await Promise.all([getStats(), getNow()]);
  return <SignupSection stats={stats} utm={utm} serverNow={now} />;
}
