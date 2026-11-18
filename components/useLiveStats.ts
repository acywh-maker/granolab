"use client";

import { useEffect, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import type { Stats } from "@/lib/campaign";

// ── 실시간 신호 (페이지 전체에서 하나만) ─────────────────────────
// DB 가 신청이 들어올 때마다 "granolab-stats" 공개 채널로 신호를 보내요.
// 공개 채널이라 누구나 가짜 신호를 보낼 수 있어서, 신호에 담긴 숫자는 믿지 않고
// "바뀌었어요" 알림으로만 써요. 숫자는 항상 DB 집계 창구에서 다시 읽어요.
//
// 채널은 페이지에서 하나만 만들어 같이 써요.
// (화면을 오갈 때마다 만들고 지우면, 지우는 중인 채널을 다시 받아 실시간이 끊길 수 있어요)

type Listener = () => void;
const signalListeners = new Set<Listener>();
const statusListeners = new Set<(live: boolean) => void>();
let channel: RealtimeChannel | null = null;
let isLive = false;

const notifyAll = () => signalListeners.forEach((fn) => fn());

function ensureChannel() {
  if (channel) return;
  const supabase = getSupabase();
  const ch = supabase
    .channel("granolab-stats")
    .on("broadcast", { event: "applied" }, notifyAll)
    .subscribe((status) => {
      isLive = status === "SUBSCRIBED";
      statusListeners.forEach((fn) => fn(isLive));
      // 연결되거나 다시 연결되면 → 그동안 놓친 신청이 있을 수 있으니 한 번 새로 읽기
      if (status === "SUBSCRIBED") notifyAll();
      // 완전히 끊기면 → 다음에 화면이 열릴 때 새로 만들 수 있게 비우기
      if (status === "CLOSED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        if (channel === ch) channel = null;
        supabase.removeChannel(ch);
      }
    });
  channel = ch;
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

  useEffect(() => {
    ensureChannel();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const reload = () => {
      // 신호가 연달아 와도 0.3초 안에는 반드시 한 번 읽어요.
      // (새 신호가 올 때마다 기다림을 다시 시작하면, 가짜 신호를 계속 보내 숫자를 멈출 수 있어서)
      if (timer) return;
      timer = setTimeout(async () => {
        timer = undefined;
        const { data, error } = await getSupabase().rpc("granolab_stats");
        if (error || !data) return;
        const next = data as unknown as Stats;
        // 신청 수는 줄어들지 않아요 → 늦게 도착한 옛날 결과는 버리기 (숫자가 거꾸로 가지 않게)
        setStats((prev) => (next.total >= prev.total ? next : prev));
      }, 300);
    };

    signalListeners.add(reload);
    statusListeners.add(setLive);
    // 이미 연결돼 있으면 바로 표시
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
