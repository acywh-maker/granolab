import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
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
};

// 모든 페이지 공통 틀 — 브랜드 헤더
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#f7f5ef] text-stone-900">
        <header className="border-b border-emerald-900/10 bg-[#f7f5ef]/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
            <Link href="/" className="text-lg font-extrabold tracking-tight text-emerald-800">
              Granolab
            </Link>
            <Link href="/stats" className="rounded-lg px-3 py-2 text-sm text-stone-500 hover:bg-white hover:text-stone-800">
              성과 보기
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
