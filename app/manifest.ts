import type { MetadataRoute } from "next";

// 앱 정보 — 휴대폰 "홈 화면에 추가" 때 쓰여요 (주소 /manifest.webmanifest 로 자동 제공)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "그래놀랩 · 말차 크런치 체험단",
    short_name: "그래놀랩",
    description: "말차 크런치 출시 전 체험단 100명 선착순 모집",
    start_url: "/",
    display: "standalone", // 주소창 없는 전체 화면
    background_color: "#1C1917",
    theme_color: "#1C1917",
    lang: "ko",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      // 안드로이드가 아이콘을 동그랗게 잘라도 글자가 남도록 여백을 둔 버전
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
