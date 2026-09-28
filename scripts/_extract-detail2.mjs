import fs from 'fs'
import path from 'path'

const nuxt = '.local/m.mfuns.net/m.mfuns.net/_nuxt'

function pretty(s) {
  return s.replace(/;/g, ';\n').replace(/\{/g, '{\n').replace(/,/g, ',\n')
}

// BlackRoomCard
for (const f of ['4d2771f.js', '838ac98.js']) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  fs.writeFileSync(`scripts/_chunk-${f.replace('.js','')}.txt`, pretty(s).slice(0, 80000))
  console.log('wrote', f)
}

// playlist detail pages - find which HTML exists and unique chunks
const base = '.local/m.mfuns.net/m.mfuns.net'
// check blackroom subroutes
function walk(dir, depth = 0) {
  if (depth > 3) return
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) {
      console.log('DIR', p.replace(base, ''))
      walk(p, depth + 1)
    } else if (name === 'index.html') {
      console.log('HTML', p.replace(base, ''))
    }
  }
}
walk(path.join(base, 'blackroom'))
walk(path.join(base, 'playlist'))

// Find playlist/:id chunk from webpack route table
const runtimeCandidates = fs.readdirSync(nuxt).filter((f) => f.endsWith('.js') && fs.statSync(path.join(nuxt, f)).size < 500000)
let routeHits = []
for (const f of runtimeCandidates) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  if (s.includes('playlist/mylist') && s.includes('blackroom') && s.includes('member/sign')) {
    routeHits.push([f, s.length])
  }
}
console.log('route table chunks', routeHits.slice(0, 10))

// Extract favorite API module fully from mylist chunk
const my = fs.readFileSync(path.join(nuxt, 'f734d65.js'), 'utf8')
const favIdx = my.indexOf('get_favorite_list')
console.log('fav around', pretty(my.slice(favIdx - 500, favIdx + 2500)).slice(0, 3000))

// Auth: middleware in page chunks
for (const [name, f] of [
  ['media', '7ad8765.js'],
  ['mylist', 'f734d65.js'],
  ['sign', 'bed0526.js'],
  ['blackroom', '7f0da3a.js'],
  ['sign_rank', '56daa3e.js'],
]) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  console.log(
    name,
    'isLogin?',
    s.includes('isLogin'),
    'middleware?',
    /middleware/.test(s),
    'login replace?',
    s.includes('/member/login'),
  )
}

// CSS modules for media grid / sign today-border / blackroom
for (const f of ['7ad8765.js', 'bed0526.js', '7f0da3a.js']) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  // look for css exports like .grid or today-border
  const cssMods = [...s.matchAll(/(\d+):function\(t,e,r\)\{t\.exports=\{([\s\S]*?)\}\}/g)]
  // simpler: find style strings
  const styles = [...s.matchAll(/\.([a-zA-Z_-][a-zA-Z0-9_-]*)\{[^}]{0,200}\}/g)].map((m) => m[0])
  console.log(f, 'inline css snippets', styles.slice(0, 15))
}

// Find css files linked from HTML
for (const p of ['media', 'playlist/mylist', 'member/sign', 'blackroom']) {
  const html = fs.readFileSync(path.join(base, p, 'index.html'), 'utf8')
  const css = [...html.matchAll(/\/_nuxt\/css\/([a-f0-9]+\.css)/g)].map((m) => m[1])
  const uniqPageJs = [...html.matchAll(/\/_nuxt\/([a-f0-9]+\.js)/g)].map((m) => m[1])
  // page-specific usually last
  console.log(p, 'css', [...new Set(css)], 'last js', uniqPageJs[uniqPageJs.length - 1])
}

// BlackRoomCard detail
const card = fs.readFileSync(path.join(nuxt, '4d2771f.js'), 'utf8')
console.log('\n=== BlackRoomCard excerpt ===')
console.log(pretty(card).slice(0, 6000))

const detail = fs.readFileSync(path.join(nuxt, '838ac98.js'), 'utf8')
console.log('\n=== blackroom detail excerpt ===')
console.log(pretty(detail).slice(0, 6000))

// playlist detail chunk 18f1114
const pd = fs.readFileSync(path.join(nuxt, '18f1114.js'), 'utf8')
console.log('\n=== playlist 18f1114 ===')
console.log('zh', [...new Set([...pd.matchAll(/["'`]([^"'`]{0,40}[\u4e00-\u9fff][^"'`]{0,40})["'`]/g)].map((m) => m[1]))].slice(0, 40))
console.log('apis', [...new Set([...pd.matchAll(/["'`](\/favorite[^"'`]*)["'`]/g)].map((m) => m[1]))])
console.log(pretty(pd).slice(0, 5000))

// Check auth middleware 300fe9c
const mw = fs.readFileSync(path.join(nuxt, '300fe9c.js'), 'utf8')
console.log('\n=== middleware 300fe9c ===')
console.log(pretty(mw))

// Which pages use auth middleware from router
const app = fs.readFileSync(path.join(nuxt, '25d2d34.js'), 'utf8')
// search route definitions for media/sign etc
for (const route of ['media', 'mylist', 'sign', 'blackroom', 'sign_rank']) {
  const i = app.indexOf(route)
  console.log('25d2d34 has', route, i)
}
