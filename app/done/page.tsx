import { Suspense } from "react";
import Link from "next/link";

// 주소 /done — 신청 완료 (개인정보는 보여 주지 않고 "몇 번째"만)
export default function DonePage({ searchParams }: PageProps<"/done">) {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <Suspense fallback={<p className="text-stone-500">확인하는 중…</p>}>
        <DoneMessage searchParams={searchParams} />
      </Suspense>

      <div className="w-full rounded-2xl bg-white p-5 text-left text-sm text-stone-600 shadow-sm ring-1 ring-emerald-900/10">
        <p className="font-semibold text-stone-800">다음 일정</p>
        <ul className="mt-2 flex flex-col gap-1">
          <li>📢 당첨 발표 · 12월 5일 (토) 문자 안내</li>
          <li>📦 배송 · 12월 둘째 주</li>
          <li>✍️ 후기 작성 · 받은 날부터 7일 안에</li>
        </ul>
      </div>

      <Link href="/" className="min-h-12 rounded-2xl px-6 py-3 font-semibold text-emerald-800 hover:bg-emerald-50">
        처음으로
      </Link>
    </main>
  );
}

async function DoneMessage({ searchParams }: { searchParams: PageProps<"/done">["searchParams"] }) {
  const { n } = await searchParams;
  const rank = Number(Array.isArray(n) ? n[0] : n);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-5xl">🎉</p>
      <h1 className="text-2xl font-extrabold text-stone-900">
        {Number.isInteger(rank) && rank > 0 ? `${rank.toLocaleString("ko-KR")}번째 신청자예요!` : "신청이 완료됐어요!"}
      </h1>
      <p className="text-stone-600">말차 크런치 체험단 신청이 접수됐어요.</p>
    </div>
  );
}
