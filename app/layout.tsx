import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import InstallPrompt from "@/components/InstallPrompt";
import PwaSetup from "@/components/PwaSetup";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "말차 크런치 체험단 · 그래놀랩",
  description: "그래놀랩 신제품 말차 크런치, 출시 전 체험단 100명을 선착순으로 모집해요.",
  // 아이폰 "홈 화면에 추가" 때 쓰는 설정 (아이콘은 app/apple-icon.png 가 자동으로 연결돼요)
  appleWebApp: {
    capable: true,
    title: "그래놀랩",
    statusBarStyle: "default", // 시계 · 배터리가 잘 보이는 기본 상태 표시줄
  },
};

// 휴대폰 화면 설정 — 상단 바 색 · 노치(화면 위 홈) 영역까지 쓰기
export const viewport: Viewport = {
  themeColor: "#1C1917",
  viewportFit: "cover",
};

// 모든 페이지 공통 틀 — 브랜드 헤더 + 앱(PWA) 도우미
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#1C1917] text-stone-200">
        <PwaSetup />
        <header
          className="border-b border-emerald-900/10 bg-[#f7f5ef]/90 backdrop-blur"
          // 앱으로 열었을 때 휴대폰 상단(시계 · 배터리) 아래로 내려오게
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-2 sm:px-6">
            <Link href="/" className="flex min-h-11 items-center text-lg font-extrabold tracking-tight text-emerald-800">
              Granolab
            </Link>
            <Link
              href="/stats"
              className="flex min-h-11 items-center rounded-lg px-3 text-sm text-stone-500 hover:bg-white hover:text-stone-800"
            >
              성과 보기
            </Link>
          </div>
        </header>
        {children}
        <InstallPrompt />
      </body>
    </html>
  );
}
