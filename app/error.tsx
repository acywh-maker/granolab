"use client"; // "다시 시도" 버튼이 있어서 클라이언트 컴포넌트

import { useEffect } from "react";

// 문제가 생겼을 때 화면 (Next.js 16: 다시 시도 함수 이름이 retry)
export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="text-4xl">🥣</p>
      <h1 className="text-xl font-bold text-stone-800">잠시 문제가 생겼어요</h1>
      <p className="text-stone-600">잠시 후 다시 시도해 주세요.</p>
      <button
        type="button"
        onClick={() => retry()}
        className="min-h-12 rounded-2xl bg-emerald-700 px-6 py-3 font-semibold text-white hover:bg-emerald-800"
      >
        다시 시도
      </button>
    </main>
  );
}
