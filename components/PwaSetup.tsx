"use client"; // 브라우저에서만 할 수 있는 일(서비스 워커 등록 · 인터넷 연결 확인)이라 클라이언트 컴포넌트

import { useEffect } from "react";
import { useOnline } from "@/components/useOnline";

// 1) 서비스 워커(오프라인 도우미) 등록
// 2) 인터넷이 끊기면 위쪽에 안내 띠
export default function PwaSetup() {
  const online = useOnline();

  useEffect(() => {
    // 개발 중(npm run dev)에는 등록하지 않아요 — 저장된 옛 화면 때문에 헷갈리지 않게
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      // updateViaCache: "none" → 도우미 파일(sw.js)을 항상 새로 확인해서, 새 버전이 나오면 바로 바뀌어요
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch(() => {});
  }, []);

  if (online) return null;

  return (
    <div role="status" className="bg-amber-100 px-4 py-2 text-center text-sm font-medium text-amber-900">
      인터넷이 끊겼어요. 마지막으로 본 화면이에요. 신청은 다시 연결된 뒤에 할 수 있어요.
    </div>
  );
}
