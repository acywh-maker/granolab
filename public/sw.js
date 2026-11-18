// 그래놀랩 서비스 워커 — 인터넷이 끊겨도 마지막으로 본 화면을 보여 주는 도우미
//
// 원칙
// 1) 화면(페이지)은 "인터넷 먼저": 연결돼 있으면 항상 새 화면을 받아요 → 새 버전을 배포하면 바로 바뀌어요.
//    받은 화면은 복사해 두었다가, 인터넷이 끊겼거나 4초 안에 응답이 없을 때만 꺼내 보여 줘요.
// 2) 이름에 버전 번호가 붙은 파일(/_next/static/...)은 바뀌지 않으니 저장해 두고 재사용해요.
// 3) 신청(POST) · Supabase 요청(다른 주소)은 절대 건드리지 않아요 → 개인정보를 저장하지 않아요.

const VERSION = "granolab-v2";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const OFFLINE_URL = "/";
const NETWORK_TIMEOUT_MS = 4000; // 신호가 약해 응답이 없을 때 저장본으로 넘어가는 시간
const MAX_ASSETS = 80; // 저장 파일이 끝없이 늘지 않게

// 저장 안 된 화면을 오프라인에서 열었을 때 보여 줄 안내 화면
const OFFLINE_HTML = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>오프라인 · 그래놀랩</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#1C1917;color:#CACFAB;font-family:system-ui,sans-serif;text-align:center;padding:24px">
<div><p style="font-size:40px;margin:0">📶</p><h1 style="font-size:20px">인터넷이 끊겼어요</h1>
<p style="color:#a8a29e">이 화면은 아직 저장돼 있지 않아요.<br>연결되면 다시 열어 주세요.</p>
<p><a href="/" style="color:#CACFAB">처음 화면으로</a></p></div></body></html>`;

// 주소에서 ?utm_source=... 같은 뒷부분을 빼고 저장 → 링크마다 따로 쌓이지 않게
const pageKey = (url) => new Request(new URL(url).pathname);

async function trimAssets() {
  const cache = await caches.open(ASSETS);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(key);
}

async function saveAsset(req, res) {
  const cache = await caches.open(ASSETS);
  await cache.put(req, res);
  await trimAssets();
}

self.addEventListener("install", (event) => {
  // 첫 화면을 미리 저장해 두기
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

// 화면이 "처음 방문 때 이미 불러온 파일 목록"을 보내 주면 저장해 둬요
// (도우미가 생기기 전에 받은 파일이라, 이렇게 따로 저장해야 첫 오프라인 때도 디자인이 깨지지 않아요)
self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || data.type !== "cache-assets" || !Array.isArray(data.urls)) return;
  const urls = data.urls.filter((u) => {
    try {
      const url = new URL(u);
      return url.origin === self.location.origin && url.pathname.startsWith("/_next/static/");
    } catch {
      return false;
    }
  });
  event.waitUntil(
    caches
      .open(ASSETS)
      .then((cache) => Promise.all(urls.map((u) => cache.add(u).catch(() => {}))))
      .then(trimAssets),
  );
});

// 인터넷 먼저 받되, 정해진 시간 안에 응답이 없으면 실패로 처리
function fetchWithTimeout(req) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), NETWORK_TIMEOUT_MS);
    fetch(req).then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 다른 주소(Supabase 등) · GET 이 아닌 요청(신청 저장)은 그냥 통과
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  // 화면 이동: 인터넷 먼저, 안 되면 저장해 둔 그 화면, 그것도 없으면 오프라인 안내
  if (req.mode === "navigate") {
    event.respondWith(
      fetchWithTimeout(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(PAGES).then((cache) => cache.put(pageKey(req.url), copy));
          }
          return res;
        })
        .catch(
          async () =>
            (await caches.match(pageKey(req.url))) ||
            new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } }),
        ),
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
            if (res.ok) saveAsset(req, res.clone());
            return res;
          }),
      ),
    );
  }
});
