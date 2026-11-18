"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import type { Stats } from "@/lib/campaign";

// ── 실시간 신호 (페이지 전체에서 하나만) ─────────────────────────
// DB 가 신청이 들어올 때마다 "granolab-stats" 공개 채널로 신호를 보내요.
// 공개 채널이라 누구나 가짜 신호를 보낼 수 있어서, 신호에 담긴 숫자는 믿지 않고
// "바뀌었어요" 알림으로만 써요. 숫자는 항상 DB 집계 창구에서 다시 읽어요.
//
// 채널은 페이지에서 하나만 만들고 지우지 않아요.
// 연결이 끊기면 Supabase 도구가 알아서 다시 연결해 줘요.

type Listener = () => void;
const signalListeners = new Set<Listener>();
const statusListeners = new Set<(live: boolean) => void>();
let started = false;
let isLive = false;
let everConnected = false;

const notifyAll = () => signalListeners.forEach((fn) => fn());

function ensureChannel() {
  if (started) return;
  started = true;
  getSupabase()
    .channel("granolab-stats")
    .on("broadcast", { event: "applied" }, notifyAll)
    .subscribe((status) => {
      isLive = status === "SUBSCRIBED";
      statusListeners.forEach((fn) => fn(isLive));
      if (status === "SUBSCRIBED") {
        // 처음 연결 때는 서버가 방금 준 숫자가 최신이라 그대로 두고,
        // 끊겼다 다시 연결됐을 때만 그동안 놓친 신청을 위해 한 번 새로 읽어요
        if (everConnected) notifyAll();
        everConnected = true;
      }
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

  useEffect(() => {
    ensureChannel();
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false; // 지금 읽는 중인지
    let again = false; // 읽는 동안 신호가 또 왔는지

    // 한 번에 하나씩만 읽어요 → 결과가 뒤바뀌어 도착할 일이 없어요
    const fetchStats = async () => {
      running = true;
      do {
        again = false;
        const { data, error } = await getSupabase().rpc("granolab_stats");
        if (alive && !error && data) setStats(data as unknown as Stats);
      } while (again && alive);
      running = false;
    };

    const reload = () => {
      if (running) {
        again = true; // 지금 읽는 게 끝나면 한 번 더
        return;
      }
      // 신호가 연달아 와도 0.3초 안에는 반드시 한 번 읽어요
      // (새 신호마다 기다림을 다시 시작하면 가짜 신호로 숫자를 멈출 수 있어서)
      if (timer) return;
      timer = setTimeout(() => {
        timer = undefined;
        fetchStats();
      }, 300);
    };

    signalListeners.add(reload);
    statusListeners.add(setLive);
    const sync = setTimeout(() => setLive(isLive), 0); // 이미 연결돼 있으면 바로 표시
    return () => {
      alive = false;
      clearTimeout(timer);
      clearTimeout(sync);
      signalListeners.delete(reload);
      statusListeners.delete(setLive);
    };
  }, []);

  return { stats, live };
}
