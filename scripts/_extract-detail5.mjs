import fs from 'fs'
import path from 'path'

const nuxt = '.local/m.mfuns.net/m.mfuns.net/_nuxt'
const base = '.local/m.mfuns.net/m.mfuns.net'

function chunksOf(page) {
  const h = fs.readFileSync(path.join(base, page, 'index.html'), 'utf8')
  return [...new Set([...h.matchAll(/\/_nuxt\/([a-f0-9]+\.js)/g)].map((m) => m[1]))]
}

const home = new Set(chunksOf('home'))
for (const p of ['media', 'playlist/mylist', 'member/sign', 'blackroom', 'member/sign_rank']) {
  const all = chunksOf(p)
  console.log(p, 'unique', all.filter((x) => !home.has(x)), 'pageCss last from earlier')
}

const s = fs.readFileSync(path.join(nuxt, '9fa3d6a.js'), 'utf8')
const pretty = s.replace(/;/g, ';\n').replace(/\{/g, '{\n')
fs.writeFileSync('scripts/_chunk-playlist-detail.txt', pretty.slice(0, 100000))
console.log('playlist titles', [...s.matchAll(/title:"([^"]+)"/g)].map((m) => m[1]))
console.log('zh', [...new Set([...s.matchAll(/"([^"]*[\u4e00-\u9fff][^"]*)"/g)].map((m) => m[1]))].slice(0, 50))

// extract key methods
for (const needle of ['getFavoriteInfo', 'getFavoriteItem', 'removeFavorite', 'subscribe', 'mounted', 'load']) {
  const i = s.indexOf(needle)
  console.log(needle, i)
}
console.log(pretty.slice(0, 8000))
