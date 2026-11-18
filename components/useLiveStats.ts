"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { Stats } from "@/lib/campaign";

// ── 실시간 신호 (페이지 전체에서 하나만) ─────────────────────────
// DB 가 신청이 들어올 때마다 "granolab-stats" 공개 채널로 신호를 보내요.
// 공개 채널이라 누구나 가짜 신호를 보낼 수 있어서, 신호에 담긴 숫자는 믿지 않고
// "바뀌었어요" 알림으로만 써요. 숫자는 항상 DB 집계 창구에서 다시 읽어요.
//
// 채널은 페이지에서 딱 하나만 만들어 계속 써요.
// (화면을 오갈 때마다 만들고 지우면, 지우는 중인 채널을 다시 받아 실시간이 끊길 수 있어요)

type Listener = () => void;
const signalListeners = new Set<Listener>();
const statusListeners = new Set<(live: boolean) => void>();
let channel: RealtimeChannel | null = null;
let isLive = false;

function ensureChannel() {
  if (channel) return;
  channel = getSupabase()
    .channel("granolab-stats")
    .on("broadcast", { event: "applied" }, () => {
      signalListeners.forEach((fn) => fn());
    })
    .subscribe((status) => {
      isLive = status === "SUBSCRIBED";
      statusListeners.forEach((fn) => fn(isLive));
    });
}

// ── 화면에서 쓰는 도구 ──────────────────────────────────────
// 서버가 처음 준 숫자로 시작해서, 신호가 오면 DB 에서 최신 숫자를 다시 읽어요.
export function useLiveStats(initial: Stats) {
  const [stats, setStats] = useState(initial);
  const [live, setLive] = useState(false);

  // 서버가 새 숫자를 주면(다시 들어왔을 때 등) 그걸로 맞추기
  const [prevInitial, setPrevInitial] = useState(initial);
  if (initial !== prevInitial) {
    setPrevInitial(initial);
    setStats(initial);
  }

  const latestRequest = useRef(0);

  useEffect(() => {
    ensureChannel();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const reload = () => {
      // 신호가 연달아 오면 0.3초 모아서 한 번만 읽기
      clearTimeout(timer);
      timer = setTimeout(async () => {
        const id = ++latestRequest.current;
        const { data, error } = await getSupabase().rpc("granolab_stats");
        // 늦게 도착한 옛날 결과는 버리기 (숫자가 거꾸로 가지 않게)
        if (error || !data || id !== latestRequest.current) return;
        setStats(data as unknown as Stats);
      }, 300);
    };

    signalListeners.add(reload);
    statusListeners.add(setLive);
    // 이미 연결돼 있으면 바로 표시 (구독 시점 이후 바뀐 상태만 알림이 오므로 다음 틱에 맞춤)
    const sync = setTimeout(() => setLive(isLive), 0);
    return () => {
      clearTimeout(timer);
      clearTimeout(sync);
      signalListeners.delete(reload);
      statusListeners.delete(setLive);
    };
  }, []);

  return { stats, live };
}
