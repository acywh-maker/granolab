"use client"; // 휴대폰 종류 확인 · 설치 버튼 · 닫기가 있어서 클라이언트 컴포넌트

import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";

// 휴대폰에서만 아래쪽에 뜨는 "홈 화면에 추가" 안내
// - 신청 페이지(/)에서는 띄우지 않아요 → 신청 버튼을 가리지 않게 (신청 완료 · 성과 화면에서만)
// - 안드로이드(크롬 등): 브라우저가 허락하면 [설치하기] 버튼, 아니면 메뉴 안내
// - 아이폰: 애플이 설치 버튼을 막아 둬서 "공유 → 홈 화면에 추가" 안내만 가능
// - 카카오톡 · 인스타그램 등 앱 안 브라우저: 홈 화면 추가가 안 돼서 "다른 브라우저로 열기" 안내
// - 이미 앱으로 열었거나, 설치했거나, 한 번 닫았으면 다시 안 떠요

type Kind = "ios" | "android" | "inapp" | "desktop" | "installed" | "dismissed" | "unknown";
const DISMISS_KEY = "granolab-install-dismissed";
const SHOW_ON = ["/done", "/stats"];

function remember() {
  try {
    localStorage.setItem(DISMISS_KEY, "1");
  } catch {
    // 개인정보 보호 모드 등 저장소를 못 쓰면 그냥 넘어가요
  }
}

function readKind(): Kind {
  try {
    if (localStorage.getItem(DISMISS_KEY) === "1") return "dismissed";
  } catch {}
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (standalone) return "installed";
  const ua = navigator.userAgent;
  const mobile = /iPhone|iPad|iPod|Android/.test(ua);
  if (mobile && /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\//i.test(ua)) return "inapp";
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "desktop";
}

const noop = () => () => {};

// 브라우저가 주는 "설치해도 돼요" 신호 (안드로이드 크롬)
type InstallEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

export default function InstallPrompt() {
  const pathname = usePathname();
  const detected = useSyncExternalStore(noop, readKind, () => "unknown" as Kind);
  const [closed, setClosed] = useState(false);
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault(); // 브라우저 기본 안내 대신 우리 안내에서 버튼으로
      setInstallEvent(e as InstallEvent);
    };
    const onInstalled = () => {
      remember(); // 설치했으면 다음에 브라우저로 와도 다시 안 띄우기
      setClosed(true);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const showable = detected === "ios" || detected === "android" || detected === "inapp";
  if (closed || !showable || !SHOW_ON.some((p) => pathname.startsWith(p))) return null;

  const close = () => {
    setClosed(true);
    remember();
  };

  const install = async () => {
    if (!installEvent) return;
    try {
      await installEvent.prompt();
      await installEvent.userChoice;
    } catch {
      // 이미 쓴 신호거나 브라우저가 거절한 경우 — 안내만 닫아요
    }
    setInstallEvent(null);
    close();
  };

  return (
    <div
      role="dialog"
      aria-label="홈 화면에 추가"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pt-3"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="mx-auto flex max-w-xl items-start gap-3 rounded-2xl bg-white p-4 shadow-2xl ring-1 ring-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icon-192.png" alt="" width={44} height={44} className="rounded-xl" />
        <div className="min-w-0 flex-1 text-sm text-stone-700">
          <p className="font-bold text-stone-900">홈 화면에 그래놀랩 추가하기</p>
          {detected === "inapp" ? (
            <p className="mt-1">
              이 앱 안에서는 홈 화면 추가가 안 돼요. 오른쪽 위 <b>메뉴</b>에서 <b>&lsquo;다른 브라우저로 열기&rsquo;</b>를 누른 뒤 추가해 주세요.
            </p>
          ) : detected === "ios" ? (
            <p className="mt-1">
              아래 <b>공유 버튼(□↑)</b>을 누르고 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 골라 주세요. 당첨 발표 전까지 남은 자리를 앱처럼 바로 확인할 수 있어요.
            </p>
          ) : installEvent ? (
            <p className="mt-1">한 번 누르면 앱처럼 설치돼요. 당첨 발표 전까지 바로 확인할 수 있어요.</p>
          ) : (
            <p className="mt-1">
              브라우저 <b>메뉴(⋮)</b>에서 <b>&lsquo;홈 화면에 추가&rsquo;</b>를 골라 주세요.
            </p>
          )}
          {detected === "android" && installEvent && (
            <button
              type="button"
              onClick={install}
              className="mt-3 min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
            >
              설치하기
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="닫기"
          className="-m-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg text-stone-400 hover:bg-stone-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
