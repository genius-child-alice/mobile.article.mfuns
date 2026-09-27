#!/usr/bin/env node
/**
 * Full UI reference mirror for m.mfuns.net (Nuxt 2 mobile).
 * - Complete webpack /_nuxt build
 * - All major SSR page shells
 * - Sample article / video / feed / member / tag pages (from public API)
 * - Static assets on m.mfuns.net, resource.mfuns.net, cdn2.mfuns.net
 * Output: .local/m.mfuns.net/
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, '.local', 'm.mfuns.net');
const SITE = 'https://m.mfuns.net';
const API_V1 = 'https://api.mfuns.net/v1';
const UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const STATIC_ROUTES = [
  '/',
  '/home',
  '/timeline',
  '/member',
  '/member/login',
  '/member/register',
  '/member/profile',
  '/member/history',
  '/member/badges',
  '/member/sign',
  '/member/sign_rank',
  '/member/reset_password',
  '/search',
  '/leaderboard',
  '/blackroom',
  '/blackroom/',
  '/create',
  '/create/article',
  '/create/video',
  '/create/feed',
  '/create/success',
  '/playlist/mylist',
  '/media/',
  '/premium',
  '/message',
  '/message/comment',
  '/message/like',
  '/message/mention',
  '/message/list',
  '/settings',
  '/settings/about',
  '/settings/security',
  '/settings/themes',
  '/404',
  '/favicon.ico',
  '/manifest.json',
  '/mfuns_logo.png',
  '/icon.png',
  '/icons/icon-192-maskable.png',
  '/aliyun-upload-sdk/aliyun-upload-sdk-1.5.2.min.js',
  '/aliyun-upload-sdk/lib/aliyun-oss-sdk-6.13.0.min.js',
  '/aliyun-upload-sdk/lib/es6-promise.min.js',
];

const CATEGORY_IDS = [1, 8, 14, 21, 25, 30, 33, 37, 40, 45, 49, 53];

const ASSET_HOSTS = new Set(['m.mfuns.net', 'resource.mfuns.net', 'cdn2.mfuns.net']);

function localPathForUrl(url) {
  const u = new URL(url);
  let pathname = u.pathname;
  const base = pathname.split('/').pop() ?? '';
  const looksLikeFile = /\.[a-z0-9]{2,5}$/i.test(base);
  if (looksLikeFile) {
    return path.join(OUT_DIR, u.hostname, pathname);
  }
  if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);
  if (!pathname) pathname = '/';
  if (pathname === '/') return path.join(OUT_DIR, u.hostname, 'index.html');
  return path.join(OUT_DIR, u.hostname, pathname, 'index.html');
}

function absUrl(raw, base = SITE) {
  try {
    return new URL(raw, base).href.split(/[?#]/)[0];
  } catch {
    return null;
  }
}

function isPagePath(pathname) {
  if (!pathname.startsWith('/')) return false;
  if (pathname.startsWith('/_nuxt')) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return false;
  return true;
}

function extractLinksFromHtml(html, pageUrl) {
  /** @type {Set<string>} */
  const urls = new Set();
  for (const m of html.matchAll(/\b(?:src|href)=["']([^"']+)["']/gi)) {
    const abs = absUrl(m[1], pageUrl);
    if (!abs) continue;
    if (ASSET_HOSTS.has(new URL(abs).hostname)) urls.add(abs);
  }
  return urls;
}

function extractAssetUrlsFromText(text) {
  /** @type {Set<string>} */
  const urls = new Set();
  for (const m of text.matchAll(/https?:\/\/(?:m\.mfuns\.net|resource\.mfuns\.net|cdn2\.mfuns\.net)[^\s"'`)\\]+/g)) {
    const abs = absUrl(m[0]);
    if (abs) urls.add(abs);
  }
  for (const m of text.matchAll(/\/static\/[a-zA-Z0-9._-]+/g)) {
    const abs = absUrl(m[0], 'https://cdn2.mfuns.net');
    if (abs) urls.add(abs);
  }
  for (const m of text.matchAll(/\/(?:_nuxt|icons|aliyun-upload-sdk)[^\s"'`)\\]+/g)) {
    const abs = absUrl(m[0], SITE);
    if (abs) urls.add(abs);
  }
  return urls;
}

/** @param {string} runtimeText */
function parseWebpackNuxtAssets(runtimeText) {
  /** @type {Set<string>} */
  const urls = new Set();

  function sliceMap(startMarker, endMarker) {
    const start = runtimeText.indexOf(startMarker);
    if (start === -1) return null;
    const from = start + startMarker.length;
    const end = runtimeText.indexOf(endMarker, from);
    if (end === -1) return null;
    return runtimeText.slice(from, end);
  }

  const jsMapStr = sliceMap('return o.p+""+{', '}[e]+".js"');
  const cssMapStr = sliceMap('r="css/"+{', '}[e]+".css"');

  if (jsMapStr) {
    for (const m of jsMapStr.matchAll(/:"([a-f0-9]{7})"/g)) {
      urls.add(`${SITE}/_nuxt/${m[1]}.js`);
    }
  }
  if (cssMapStr) {
    for (const m of cssMapStr.matchAll(/:"([a-f0-9]{7})"/g)) {
      if (m[1] === '31d6cfe') continue;
      urls.add(`${SITE}/_nuxt/css/${m[1]}.css`);
    }
  }

  return urls;
}

async function fetchBuffer(url, retries = 4) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': UA,
          Accept: '*/*',
          Referer: `${SITE}/home`,
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(60_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw lastErr;
}

function readLocalMirror(url) {
  const filePath = localPathForUrl(url);
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath);
}

async function fetchBufferOrLocal(url) {
  try {
    return await fetchBuffer(url);
  } catch (err) {
    const local = readLocalMirror(url);
    if (local) {
      console.warn(`\n   [cache] ${url} (${err.message})`);
      return local;
    }
    throw err;
  }
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'application/json',
      Origin: SITE,
      Referer: `${SITE}/home`,
    },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function save(url, buf) {
  const filePath = localPathForUrl(url);
  const dir = path.dirname(filePath);
  let probe = dir;
  while (probe.startsWith(path.join(OUT_DIR, 'm.mfuns.net'))) {
    if (fs.existsSync(probe) && fs.statSync(probe).isFile()) {
      fs.unlinkSync(probe);
    }
    const parent = path.dirname(probe);
    if (parent === probe) break;
    probe = parent;
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, buf);
}

async function downloadUrl(url) {
  const buf = await fetchBuffer(url);
  await save(url, buf);
  return buf;
}

async function downloadMany(urls, concurrency = 12, retries = 4) {
  /** @type {Array<{url: string, error: string}>} */
  const failed = [];
  let ok = 0;
  const list = [...urls];
  for (let i = 0; i < list.length; i += concurrency) {
    const batch = list.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          const buf = await fetchBuffer(url, retries);
          await save(url, buf);
          ok += 1;
          return null;
        } catch (err) {
          return { url, error: err.message };
        }
      }),
    );
    for (const r of results) if (r) failed.push(r);
    process.stdout.write(`\rDownloaded ${ok}/${list.length} (failed ${failed.length})`);
  }
  process.stdout.write('\n');
  return { ok, failed };
}

async function findWebpackRuntimeUrl(html) {
  for (const m of html.matchAll(/\/_nuxt\/([a-f0-9]+\.js)/g)) {
    const url = `${SITE}/_nuxt/${m[1]}`;
    try {
      const buf = await fetchBuffer(url);
      const text = buf.toString('utf8');
      if (text.includes('o.p="/_nuxt/"') || text.includes("o.p='/_nuxt/'")) {
        await save(url, buf);
        return { url, text };
      }
    } catch {
      /* try next */
    }
  }
  throw new Error('Could not locate webpack runtime bundle');
}

/** @param {unknown} item @param {{ video: number; article: number; feed: number; member: number; tag: number }} caps */
function pathsForFeedItem(item, caps) {
  /** @type {string[]} */
  const paths = [];
  if (!item || typeof item !== 'object') return paths;
  const { id, type, user, tag } = item;
  if (typeof id !== 'number') return paths;

  if (type === 1 && caps.video < 25) {
    caps.video += 1;
    paths.push(`/video/${id}`);
  } else if (type === 0 && caps.article < 25) {
    caps.article += 1;
    paths.push(`/article/${id}`);
  } else if (caps.feed < 10) {
    caps.feed += 1;
    paths.push(`/${id}`);
  }

  if (user && typeof user.id === 'number' && caps.member < 12) {
    caps.member += 1;
    paths.push(`/member/${user.id}`);
  }
  if (Array.isArray(tag) && caps.tag < 20) {
    for (const t of tag) {
      if (typeof t !== 'string' || !t.trim()) continue;
      if (caps.tag >= 20) break;
      caps.tag += 1;
      paths.push(`/tag/${encodeURIComponent(t.trim())}`);
    }
  }
  return paths;
}

async function discoverSamplePagePaths(limitPerSource = 20) {
  /** @type {Set<string>} */
  const paths = new Set();
  /** @type {Record<string, unknown>} */
  const apiSamples = {};
  const caps = { video: 0, article: 0, feed: 0, member: 0, tag: 0 };

  try {
    const rec = await fetchJson(`${API_V1}/recommend/get?page=1&limit=${limitPerSource}`);
    apiSamples.recommend = rec;
    for (const item of rec?.data?.list ?? []) {
      for (const p of pathsForFeedItem(item, caps)) paths.add(p);
    }
  } catch (err) {
    apiSamples.recommendError = String(err);
  }

  try {
    const hot = await fetchJson(`${API_V1}/leaderboards/hot?limit=${limitPerSource}`);
    apiSamples.leaderboardsHot = hot;
    for (const item of hot?.data ?? []) {
      for (const p of pathsForFeedItem(item, caps)) paths.add(p);
    }
  } catch (err) {
    apiSamples.leaderboardsHotError = String(err);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'api-samples.json'), JSON.stringify(apiSamples, null, 2));
  return paths;
}

function scanDownloadedBundlesForAssets() {
  /** @type {Set<string>} */
  const urls = new Set();
  const nuxtDir = path.join(OUT_DIR, 'm.mfuns.net', '_nuxt');
  if (!fs.existsSync(nuxtDir)) return urls;
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const st = fs.statSync(full);
      if (st.isDirectory()) walk(full);
      else if (/\.(js|css|json)$/i.test(name)) {
        const text = fs.readFileSync(full, 'utf8');
        for (const u of extractAssetUrlsFromText(text)) urls.add(u);
      }
    }
  };
  walk(nuxtDir);
  return urls;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  console.log(`Output: ${OUT_DIR}`);

  console.log('1/7 Homepage + webpack runtime');
  const homeBuf = await fetchBufferOrLocal(`${SITE}/home`);
  await save(`${SITE}/home`, homeBuf);
  const homeHtml = homeBuf.toString('utf8');
  const { url: runtimeUrl, text: runtimeText } = await findWebpackRuntimeUrl(homeHtml);
  console.log(`   Runtime: ${runtimeUrl}`);

  console.log('2/7 Discover sample detail pages (api.mfuns.net)');
  const samplePaths = await discoverSamplePagePaths(15);
  console.log(`   Sample paths: ${samplePaths.size}`);

  console.log('3/7 Collect page routes to mirror');
  /** @type {Set<string>} */
  const pagePaths = new Set(STATIC_ROUTES);
  for (const id of CATEGORY_IDS) pagePaths.add(`/category/${id}`);
  for (const p of samplePaths) pagePaths.add(p);

  /** @type {Set<string>} */
  const nuxtAssets = new Set(parseWebpackNuxtAssets(runtimeText));
  /** @type {Set<string>} */
  const extraAssets = new Set();
  /** @type {Array<{url: string, error: string}>} */
  const pageFailed = [];

  for (const u of extractLinksFromHtml(homeHtml, `${SITE}/home`)) {
    if (u.includes('/_nuxt/')) nuxtAssets.add(u);
    else extraAssets.add(u);
  }

  console.log('4/7 Download SSR pages');
  for (const route of pagePaths) {
    const pageUrl = `${SITE}${route}`;
    try {
      const buf = await fetchBufferOrLocal(pageUrl);
      await save(pageUrl, buf);
      const text = buf.toString('utf8');
      for (const link of extractLinksFromHtml(text, pageUrl)) {
        if (link.includes('/_nuxt/')) nuxtAssets.add(link);
        else extraAssets.add(link);
      }
      for (const link of extractAssetUrlsFromText(text)) extraAssets.add(link);
    } catch (err) {
      pageFailed.push({ url: pageUrl, error: err.message });
    }
  }
  console.log(`   Pages ok: ${pagePaths.size - pageFailed.length}/${pagePaths.size}`);

  console.log('5/7 Download full _nuxt build');
  const nuxtResult = await downloadMany(nuxtAssets);

  console.log('6/7 Download CDN/static extras from bundles + pages');
  for (const u of scanDownloadedBundlesForAssets()) extraAssets.add(u);
  for (const asset of nuxtAssets) extraAssets.delete(asset);

  const extraResult = await downloadMany(extraAssets, 12, 1);

  console.log('7/7 Write indexes');
  const routesIndex = {
    static: STATIC_ROUTES,
    categories: CATEGORY_IDS.map((id) => `/category/${id}`),
    samplesFromApi: [...samplePaths].sort(),
    allPageRoutes: [...pagePaths].sort(),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'routes-index.json'), JSON.stringify(routesIndex, null, 2));

  const allUrls = new Set([
    runtimeUrl,
    ...nuxtAssets,
    ...[...pagePaths].map((p) => `${SITE}${p}`),
    ...extraAssets,
  ]);
  const failed = [...pageFailed, ...nuxtResult.failed, ...extraResult.failed];

  const manifest = {
    downloadedAt: new Date().toISOString(),
    purpose: 'Full UI reference mirror of m.mfuns.net (static routes + webpack + sample content pages + CDN assets)',
    outputDir: OUT_DIR,
    site: SITE,
    apiV1: API_V1,
    userAgent: UA,
    webpackRuntime: runtimeUrl,
    stats: {
      nuxtAssetsListed: nuxtAssets.size,
      nuxtDownloadOk: nuxtResult.ok,
      nuxtDownloadFailed: nuxtResult.failed.length,
      pageRoutes: pagePaths.size,
      pageDownloadFailed: pageFailed.length,
      extraAssets: extraAssets.size,
      extraDownloadOk: extraResult.ok,
      extraDownloadFailed: extraResult.failed.length,
      samplePathsFromApi: samplePaths.size,
    },
    routesIndexFile: path.join(OUT_DIR, 'routes-index.json'),
    apiSamplesFile: path.join(OUT_DIR, 'api-samples.json'),
    failed,
    urls: [...allUrls].sort(),
  };
  fs.writeFileSync(path.join(OUT_DIR, 'mirror-manifest.json'), JSON.stringify(manifest, null, 2));

  console.log('Done.');
  console.log(`Manifest: ${path.join(OUT_DIR, 'mirror-manifest.json')}`);
  console.log(
    `Nuxt ${nuxtResult.ok}/${nuxtAssets.size}, pages ${pagePaths.size - pageFailed.length}/${pagePaths.size}, extras ${extraResult.ok}/${extraAssets.size}`,
  );
  if (pageFailed.length || nuxtResult.failed.length) {
    console.warn(`Critical failed: pages=${pageFailed.length}, nuxt=${nuxtResult.failed.length}`);
    process.exitCode = 1;
  } else if (extraResult.failed.length) {
    console.warn(`Optional CDN extras failed: ${extraResult.failed.length} (see manifest.failed)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
