import fs from 'fs'
import path from 'path'

const nuxt = '.local/m.mfuns.net/m.mfuns.net/_nuxt'

// Find BlackRoomCard and MediaList / MediaUpload2 modules
const targets = {
  BlackRoomCard: /name:"BlackRoomCard"|black-room-card|BlackRoomCard/,
  MediaList: /name:"MediaList"|MediaList/,
  MediaUpload2: /name:"MediaUpload2"|MediaUpload2/,
  playlistDetail: /playlist\/\$|pages\/playlist|get_favorite_item|getFavoriteItem/,
  authMiddleware: /middleware.*auth|auth.*middleware|isLogin/,
}

const files = fs.readdirSync(nuxt).filter((f) => f.endsWith('.js'))
for (const [label, re] of Object.entries(targets)) {
  const hits = []
  for (const f of files) {
    const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
    if (re.test(s) && s.length < 200000) hits.push([f, s.length])
  }
  console.log(label, hits.slice(0, 15))
}

// Extract MediaList + MediaUpload2 from media page chunk and shared modules
const media = fs.readFileSync(path.join(nuxt, '7ad8765.js'), 'utf8')
// find module numbers referenced: MediaUpload2:r(441), MediaLibrary:r(431), MediaList:r(440)
for (const id of [431, 440, 441, 383]) {
  const re = new RegExp(id + ':function\\(t,\\s*e,\\s*r\\)\\{[\\s\\S]{0,50}')
  const m = media.match(re)
  console.log('module', id, 'in media chunk?', !!m)
}

// Search for webpack modules that export MediaList
function extractAround(s, needle, before = 200, after = 3000) {
  const i = s.indexOf(needle)
  if (i < 0) return null
  return s.slice(Math.max(0, i - before), i + after)
}

// Find which chunk has BlackRoomCard template
for (const f of files) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  if (s.includes('name:"BlackRoomCard"') || (s.includes('BlackRoomCard') && s.includes('black_room'))) {
    console.log('\n=== BlackRoomCard in', f, '===')
    let pretty = s.replace(/;/g, ';\n').replace(/\{/g, '{\n')
    fs.writeFileSync(`scripts/_chunk-blackroom-card-${f}.txt`, pretty.slice(0, 120000))
    const zh = [...s.matchAll(/["'`]([^"'`]{0,30}[\u4e00-\u9fff][^"'`]{0,50})["'`]/g)].map((m) => m[1])
    console.log('ZH', [...new Set(zh)].slice(0, 40))
    console.log('apis', [...new Set([...s.matchAll(/["'`](\/black_room[^"'`]*)["'`]/g)].map((m) => m[1]))])
  }
}

// MediaList in chunks
for (const f of ['7ad8765.js', ...files.filter((x) => x !== '7ad8765.js')]) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  if (s.includes('name:"MediaList"') || (s.includes('MediaList') && s.includes('/media/library') && s.includes('删除文件'))) {
    if (!s.includes('删除文件') && !s.includes('name:"MediaList"')) continue
    console.log('\n=== MediaList-ish in', f, 'len', s.length)
    if (f === '7ad8765.js') {
      const idx = s.indexOf('上传媒体')
      console.log('upload media idx', idx)
    }
  }
}

// Extract from media pretty file the MediaUpload2 and MediaList sections
const pretty = fs.readFileSync('scripts/_chunk-media.txt', 'utf8')
for (const needle of ['MediaUpload2', 'MediaList', 'MediaLibrary', 'uploadImage', 'deleteImage', 'library']) {
  const i = pretty.indexOf(needle)
  console.log(needle, 'at', i)
}

// Find playlist/:id pages
const playlistDir = '.local/m.mfuns.net/m.mfuns.net/playlist'
console.log('playlist kids', fs.readdirSync(playlistDir))
const routes = JSON.parse(fs.readFileSync('.local/m.mfuns.net/routes-index.json', 'utf8'))
console.log(
  'playlist routes',
  (routes.allPageRoutes || []).filter((r) => String(r).includes('playlist')),
)
console.log(
  'blackroom routes',
  (routes.allPageRoutes || []).filter((r) => String(r).includes('blackroom')),
)

// API samples
const samples = JSON.parse(fs.readFileSync('.local/m.mfuns.net/api-samples.json', 'utf8'))
const keys = Object.keys(samples)
console.log('api sample keys count', keys.length)
for (const k of keys) {
  if (/media|favorite|sign|black_room|blackroom|playlist/i.test(k)) {
    const v = samples[k]
    const preview = typeof v === 'string' ? v.slice(0, 400) : JSON.stringify(v).slice(0, 600)
    console.log('\nAPI', k, preview)
  }
}
