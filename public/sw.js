// 그래놀랩 서비스 워커 — 인터넷이 끊겨도 마지막으로 본 화면을 보여 주는 도우미
//
// 원칙
// 1) 화면(페이지)은 "인터넷 먼저": 연결돼 있으면 항상 새 화면을 받아요 → 새 버전을 배포하면 바로 바뀌어요.
//    받은 화면은 복사해 두었다가, 인터넷이 끊겼을 때만 꺼내 보여 줘요.
// 2) 이름에 버전 번호가 붙은 파일(/_next/static/...)은 바뀌지 않으니 저장해 두고 재사용해요.
// 3) 신청(POST) · Supabase 요청(다른 주소)은 절대 건드리지 않아요 → 개인정보를 저장하지 않아요.

const VERSION = "granolab-v1";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const OFFLINE_URL = "/";

self.addEventListener("install", (event) => {
  // 첫 화면을 미리 저장해 두기 (처음부터 오프라인이어도 보여 줄 수 있게)
  event.waitUntil(caches.open(PAGES).then((cache) => cache.add(OFFLINE_URL)).catch(() => {}));
  self.skipWaiting(); // 새 도우미가 기다리지 않고 바로 일하기
});

self.addEventListener("activate", (event) => {
  // 예전 버전 저장소 지우기
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 다른 주소(Supabase 등) · GET 이 아닌 요청(신청 저장)은 그냥 통과
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // 화면 이동: 인터넷 먼저, 안 되면 저장해 둔 화면
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE_URL)) || Response.error()),
    );
    return;
  }

  // 버전 번호가 붙은 파일 · 아이콘: 저장해 둔 것 먼저
  if (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icon-")) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSETS).then((cache) => cache.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});
