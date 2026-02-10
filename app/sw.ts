/// <reference lib="webworker" />
import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";

// This declares the value of `injectionPoint` to TypeScript.
// `injectionPoint` is the string that will be replaced by the actual precache manifest.
// By default, this string is set to `"self.__WB_MANIFEST"`.
declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: defaultCache,
});

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open("cloove-offline-v1").then((cache) => {
            console.log("🛠️ PWA: Pre-caching branded offline page...");
            return cache.add("/offline");
        })
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.mode === "navigate") {
        event.respondWith(
            (async () => {
                try {
                    // 🛠️ 1. Try the browser's navigation preload
                    const preloadResponse = await event.preloadResponse;
                    if (preloadResponse) return preloadResponse;

                    // 🛠️ 2. Try fetching from the actual network
                    return await fetch(event.request);
                } catch (error) {
                    // 🛠️ 3. If Network fails, FIRST check if this specific page is in the cache
                    const cachedResponse = await caches.match(event.request);
                    if (cachedResponse) return cachedResponse;

                    // 🛠️ 4. If not in cache, try the branded offline fallback (look in all caches)
                    const offlineResponse = await caches.match("/offline");
                    if (offlineResponse) return offlineResponse;

                    // 🛠️ 5. Final Safety net
                    return new Response(
                        `<!DOCTYPE html><html><body style="background:#070e0b;color:#fdfcf8;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;flex-direction:column;"><h1>Cloove Offline</h1><p>Quietly waiting for your connection to return.</p></body></html>`,
                        { headers: { "Content-Type": "text/html" } }
                    );
                }
            })()
        );
    }
});

serwist.addEventListeners();

self.addEventListener("activate", () => {
    console.log("🛠️ PWA: Service Worker Activated and taking control.");
});
