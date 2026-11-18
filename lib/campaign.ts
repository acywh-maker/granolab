// 캠페인 규칙 · 문구를 한곳에 모은 파일 (화면과 서버가 같이 써요)
// 정원 · 마감 시각은 DB 의 granolab_settings 표에 있어요.

export const BRAND = "그래놀랩";
export const PRODUCT = "말차 크런치";

// 아침 식사 습관 보기 (DB 에는 영어 값, 화면에는 한국어)
export const BREAKFAST_OPTIONS = [
  { value: "skip", label: "아침은 거의 걸러요", short: "거름" },
  { value: "bread", label: "빵 · 시리얼", short: "빵 · 시리얼" },
  { value: "rice", label: "밥", short: "밥" },
  { value: "drink", label: "커피 · 음료만", short: "커피 · 음료" },
] as const;

export function breakfastLabel(value: string) {
  return BREAKFAST_OPTIONS.find((o) => o.value === value)?.short ?? value;
}

// 집계 숫자 (granolab_stats() 가 돌려주는 모양) — 개인정보 없음
export type Stats = {
  total: number;
  capacity: number;
  deadline: string;
  by_source: { source: string; count: number }[];
  by_breakfast: { breakfast: string; count: number }[];
};

// 정원 숫자가 비정상(0 · 빈 값)이어도 화면이 깨지지 않게 (나누기 0 방지)
export function safeCapacity(stats: Stats) {
  return stats.capacity > 0 ? stats.capacity : 1;
}

export type UtmInput ={ source: string; medium: string; campaign: string };

export type ApplicationInput = {
  name: string;
  phone: string;
  breakfast: string;
  agreed: boolean;
};

// "010-1234-5678" → "01012345678"
export function normalizePhone(phone: string) {
  return phone.replace(/[^0-9]/g, "");
}

// 화면에서 한 번(편의), 서버에서 한 번 더(안전) — 문제가 있으면 한국어 문구, 없으면 null
export function checkApplication(input: ApplicationInput) {
  const name = input.name.trim();
  if (name.length < 1 || name.length > 20) return "이름을 1~20자로 적어 주세요.";
  if (!/^010[0-9]{8}$/.test(normalizePhone(input.phone))) {
    return "휴대폰 번호를 다시 확인해 주세요. (예: 010-1234-5678)";
  }
  if (!BREAKFAST_OPTIONS.some((o) => o.value === input.breakfast)) {
    return "아침 식사 습관을 골라 주세요.";
  }
  if (!input.agreed) return "개인정보 수집에 동의해야 신청할 수 있어요.";
  return null;
}

// 남은 시간 "13일 4시간" / "3시간 20분"
export function formatRemaining(deadline: string, now: number) {
  const ms = new Date(deadline).getTime() - now;
  if (ms <= 0) return null;
  const minutes = Math.floor(ms / 60_000);
  const days = Math.floor(minutes / (60 * 24));
  const hours = Math.floor((minutes % (60 * 24)) / 60);
  if (days > 0) return `${days}일 ${hours}시간`;
  return `${hours}시간 ${minutes % 60}분`;
}

// "2026-12-02T14:59:59Z" → "12월 2일 (수) 23:59"
export function formatDeadline(deadline: string) {
  const d = new Date(new Date(deadline).getTime() + 9 * 60 * 60 * 1000); // 한국 시간
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mm = String(d.getUTCMinutes()).padStart(2, "0");
  return `${d.getUTCMonth() + 1}월 ${d.getUTCDate()}일 (${days[d.getUTCDay()]}) ${hh}:${mm}`;
}
