import { Suspense } from "react";
import StatsView from "@/components/StatsView";
import { getStats } from "@/lib/stats";
import Loading from "../loading";

// 주소 /stats — 채널별 · 아침 습관별 신청 수 (숫자만, 개인정보 없음)
export default function StatsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
      <div>
        <h1 className="text-2xl font-extrabold text-stone-900">캠페인 성과</h1>
        <p className="mt-1 text-sm text-stone-500">말차 크런치 체험단 · 이름 · 번호 없이 숫자만 보여요</p>
      </div>
      <Suspense fallback={<Loading />}>
        <StatsSection />
      </Suspense>
    </main>
  );
}

async function StatsSection() {
  const stats = await getStats();
  return <StatsView stats={stats} />;
}
