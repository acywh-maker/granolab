// 불러오는 중 화면 — 숫자를 DB 에서 읽는 동안 보여요
export default function Loading() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true">
      <div className="grid grid-cols-2 gap-3">
        <div className="h-28 animate-pulse rounded-2xl bg-stone-200/70" />
        <div className="h-28 animate-pulse rounded-2xl bg-stone-200/70" />
      </div>
      <div className="flex h-72 items-center justify-center rounded-3xl bg-stone-200/50 text-stone-500">
        신청 현황을 불러오는 중…
      </div>
    </div>
  );
}
