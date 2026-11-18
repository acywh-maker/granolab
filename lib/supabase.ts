import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// Supabase 창구 — .env.local 의 두 값(주소 · 출입증)으로 만들어요.
// 출입증으로는 DB 가 허락한 일(신청 창구 · 숫자 집계)만 할 수 있어요. 신청자 표는 잠겨 있어요.

let client: SupabaseClient<Database> | null = null;

export function getSupabase() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      ".env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 넣고 npm run dev 를 다시 켜 주세요.",
    );
  }

  client = createClient<Database>(url, key);
  return client;
}
