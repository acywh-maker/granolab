import { connection } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { Stats } from "@/lib/campaign";

// 서버에서만 부르는 함수들

// 지금 시각 (요청이 올 때마다 새로 계산)
export async function getNow() {
  await connection();
  return Date.now();
}

// 집계 숫자 읽기 — 이름 · 번호는 DB 가 애초에 돌려주지 않아요
export async function getStats(): Promise<Stats> {
  await connection(); // 요청마다 새로 읽기 (빌드 때 미리 만들지 않게)
  const { data, error } = await getSupabase().rpc("granolab_stats");
  if (error || !data) throw new Error(`신청 현황을 불러오지 못했어요: ${error?.message ?? "빈 응답"}`);
  return data as unknown as Stats;
}
