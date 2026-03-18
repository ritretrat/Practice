// Service Worker — 앱을 오프라인에서도 쓸 수 있게 해주는 백그라운드 스크립트
// display: "standalone" — 브라우저 주소창 없이 앱처럼 실행

const CACHE_NAME = 'vocab-app-v4';

// 설치 시 이 파일들을 캐시(저장)해둠
const FILES_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.png'
];

// install 이벤트 — 처음 설치될 때 실행
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(FILES_TO_CACHE); // 파일들을 캐시에 저장
    })
  );

  self.skipWaiting();
});

// active - 오래된 캐시 자동 삭제
self.addEventListener('active', function(e) {
  e.waitUntil(
    caches.keys().then(function(KeyList) {
      return Promise.all(KeyList.map(function(key) {
        if (key !== CACHE_NAME) {
          return caches.delete(key); //버전 다른 캐시 삭제
        }
      }));
    })
  );
  self.clients.claim();
});

// fetch 이벤트 — 파일 요청이 들어올 때마다 실행
// 네트워크 대신 캐시에서 먼저 찾아서 돌려줌 → 오프라인 작동
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
      // 캐시에 있으면 캐시에서, 없으면 네트워크에서
    })
  );
});