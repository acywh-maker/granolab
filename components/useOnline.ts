"use client";

import { useSyncExternalStore } from "react";

// 지금 인터넷이 연결돼 있는지 (서버에서 그릴 때는 "연결됨"으로 봐요)
function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export function useOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
