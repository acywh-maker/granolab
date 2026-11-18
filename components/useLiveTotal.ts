"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";

// 실시간 신청 수 — DB 가 신청이 들어올 때마다 "granolab-stats" 채널로 숫자만 방송해요.
// onChange 를 넘기면 숫자가 바뀔 때 추가로 할 일(예: 화면 새로 읽기)을 할 수 있어요.
export function useLiveTotal(initialTotal: number, onChange?: () => void) {
  const [total, setTotal] = useState(initialTotal);
  const [live, setLive] = useState(false);

  // 서버가 새 숫자를 주면 그걸로 맞추기
  const [prevInitial, setPrevInitial] = useState(initialTotal);
  if (initialTotal !== prevInitial) {
    setPrevInitial(initialTotal);
    setTotal(initialTotal);
  }

  useEffect(() => {
    const supabase = getSupabase();
    const channel = supabase
      .channel("granolab-stats")
      .on("broadcast", { event: "applied" }, ({ payload }) => {
        if (typeof payload?.total === "number") setTotal(payload.total);
        onChange?.();
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);

  return { total, live };
}
