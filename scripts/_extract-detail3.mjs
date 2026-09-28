import fs from 'fs'
import path from 'path'

const nuxt = '.local/m.mfuns.net/m.mfuns.net/_nuxt'
const cssDir = path.join(nuxt, 'css')

function pretty(s) {
  return s.replace(/;/g, ';\n').replace(/\{/g, '{\n')
}

// Find BlackRoomCard by exact name
for (const f of fs.readdirSync(nuxt).filter((x) => x.endsWith('.js'))) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  if (s.includes('name:"BlackRoomCard"')) {
    console.log('FOUND BlackRoomCard in', f, s.length)
    const i = s.indexOf('name:"BlackRoomCard"')
    fs.writeFileSync('scripts/_blackroom-card.txt', pretty(s.slice(Math.max(0, i - 800), i + 8000)))
  }
}

// route table
const rt = fs.readFileSync(path.join(nuxt, '492ba04.js'), 'utf8')
fs.writeFileSync('scripts/_route-table.txt', pretty(rt))
console.log('route table written', rt.length)

// extract relevant routes from route table
for (const key of ['media', 'playlist', 'sign', 'blackroom', 'mylist', 'sign_rank']) {
  const re = new RegExp(`.{0,80}${key}.{0,120}`, 'g')
  const hits = [...rt.matchAll(re)].map((m) => m[0])
  console.log('\nroute hits', key, hits.slice(0, 8))
}

// page CSS
for (const [name, file] of [
  ['media', 'bcc5387.css'],
  ['mylist', '91309cc.css'],
  ['sign', 'b4fe4bd.css'],
  ['blackroom', 'fe6cded.css'],
]) {
  const p = path.join(cssDir, file)
  if (fs.existsSync(p)) {
    const s = fs.readFileSync(p, 'utf8')
    console.log('\n==== CSS', name, file, s.length, '====')
    console.log(s.slice(0, 2500))
  } else console.log('missing css', file)
}

// MediaUpload2 template rest from media chunk
const media = fs.readFileSync(path.join(nuxt, '7ad8765.js'), 'utf8')
const i = media.indexOf('允许上传')
console.log('\nMediaUpload2 tail', pretty(media.slice(i - 200, i + 1500)))

// blackroom detail 838ac98
const d = fs.readFileSync(path.join(nuxt, '838ac98.js'), 'utf8')
console.log('\n==== blackroom detail page ====')
console.log(pretty(d))

// playlist detail - find page with get_favorite_info + app-bar
for (const f of ['18f1114.js', '7c1225c.js', '9fa3d6a.js', '501da27.js', '516b454.js', '603e789.js']) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  const hasBar = s.includes('v-app-bar') || s.includes('toolbar-title')
  const hasFav = s.includes('get_favorite_item') || s.includes('getFavoriteItem')
  console.log(f, 'bar', hasBar, 'favItem', hasFav, 'title-ish', [...s.matchAll(/title:"([^"]+)"/g)].map((m) => m[1]))
}

// Check MemberView AuthRouter usage for these links
const mv = fs.readFileSync('src/views/member/MemberView.vue', 'utf8')
console.log('\nMemberView services snippet')
const ms = fs.readFileSync('src/constants/memberServices.ts', 'utf8')
console.log(ms)
