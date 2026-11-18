"use server";

// 서버에서 실행되는 신청 처리 (Server Action)
// 브라우저 검사는 누구나 끌 수 있어서 여기서 한 번 더 검사하고, 마지막으로 DB 가 정원 · 마감 · 중복을 막아요.

import { redirect } from "next/navigation";
import { getSupabase } from "@/lib/supabase";
import { checkApplication } from "@/lib/campaign";

export type ApplyState = { message: string };

const clip = (v: FormDataEntryValue | null) => String(v ?? "").trim().slice(0, 50);

// DB 가 거절한 이유 → 고객에게 보여 줄 문구
function toKorean(error: { code?: string; message?: string }) {
  const msg = error.message ?? "";
  if (msg.includes("GRANOLAB_FULL")) return "모집이 마감됐어요. 관심 가져 주셔서 고마워요!";
  if (msg.includes("GRANOLAB_CLOSED")) return "이벤트가 종료됐어요.";
  if (msg.includes("GRANOLAB_NO_SETTINGS")) return "지금은 신청을 받을 수 없어요. 이벤트 준비 중이에요.";
  switch (error.code) {
    case "23505":
      return "이미 신청한 번호예요.";
    case "23502":
      return "개인정보 수집에 동의해야 신청할 수 있어요.";
    case "23514":
      return "입력 내용을 다시 확인해 주세요.";
    default:
      return "신청을 저장하지 못했어요. 잠시 후 다시 시도해 주세요.";
  }
}

export async function applyAction(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  const input = {
    name: String(formData.get("name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    breakfast: String(formData.get("breakfast") ?? ""),
    agreed: formData.get("agreed") === "on",
  };

  const problem = checkApplication(input);
  if (problem) return { message: problem };

  // 신청 창구 함수 — 저장하고 "몇 번째"만 돌려받아요
  const { data: rank, error } = await getSupabase().rpc("granolab_apply", {
    p_name: input.name,
    p_phone: input.phone,
    p_breakfast: input.breakfast,
    p_agreed: input.agreed,
    p_utm_source: clip(formData.get("utm_source")) || undefined,
    p_utm_medium: clip(formData.get("utm_medium")) || undefined,
    p_utm_campaign: clip(formData.get("utm_campaign")) || undefined,
  });

  if (error) return { message: toKorean(error) };

  // 성공하면 완료 화면으로 (redirect 는 try 바깥에서)
  redirect(`/done?n=${rank}`);
}
