import fs from 'fs'
import path from 'path'

const nuxt = '.local/m.mfuns.net/m.mfuns.net/_nuxt'

function pretty(s) {
  return s.replace(/;/g, ';\n').replace(/\{/g, '{\n')
}

// playlist detail page 9fa3d6a
const pd = fs.readFileSync(path.join(nuxt, '9fa3d6a.js'), 'utf8')
fs.writeFileSync('scripts/_chunk-playlist-detail.txt', pretty(pd).slice(0, 80000))
console.log('playlist detail zh', [...new Set([...pd.matchAll(/["'`]([^"'`]{0,50}[\u4e00-\u9fff][^"'`]{0,50})["'`]/g)].map(m=>m[1]))])
console.log('playlist apis', [...new Set([...pd.matchAll(/["'`](\/favorite[^"'`]*)["'`]/g)].map(m=>m[1]))])
console.log('data()', (pd.match(/data:function\(\)\{return\{[^}]{0,500}/)||[])[0])

// Find pages router with middleware auth
for (const f of fs.readdirSync(nuxt).filter(x=>x.endsWith('.js'))) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  // Nuxt route definitions often look like: path:"/media"
  if (s.includes('path:"/media"') || s.includes("path:'/media'") || s.includes('path:"/media/"')) {
    if (s.includes('component:') || s.includes('chunkName') || s.includes('webpackChunkName')) {
      console.log('router-ish', f, s.length)
      // extract nearby for each page
      for (const p of ['/media', '/playlist/mylist', '/member/sign', '/blackroom', '/member/sign_rank', '/playlist/']) {
        const idx = s.indexOf(`"${p}`)
        if (idx >= 0) console.log(p, '=>', s.slice(idx, idx + 250).replace(/\n/g,' '))
      }
    }
  }
}

// BlackRoomCard full from 4d2771f - find module that has 封禁
const card = fs.readFileSync(path.join(nuxt, '4d2771f.js'), 'utf8')
console.log('\nfull blackroom card file:\n', pretty(card))

// Also module 853 might be in shared chunk - search name BlackRoomCard content
const brc = fs.readFileSync('scripts/_blackroom-card.txt', 'utf8')
console.log('\nblackroom-card file length', brc.length)
console.log(brc.slice(0, 7000))

// Look for response field usage: credits, count, images, list, month_times
for (const [label, f] of [['sign','bed0526.js'],['media','7ad8765.js'],['black','7f0da3a.js'],['mylist','f734d65.js'],['card','4d2771f.js']]) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  const fields = [...s.matchAll(/\.data\.([a-zA-Z0-9_]+)/g)].map(m=>m[1])
  const fields2 = [...s.matchAll(/data\.([a-zA-Z0-9_]+)/g)].map(m=>m[1])
  console.log(label, 'data fields', [...new Set([...fields, ...fields2])].slice(0, 40))
}

// MediaUpload2 file size 8M check
const media = fs.readFileSync(path.join(nuxt, '7ad8765.js'), 'utf8')
const m8 = media.match(/.{0,80}8M.{0,80}|.{0,80}8388608.{0,80}|.{0,80}文件大小.{0,80}/g)
console.log('8M checks', m8)

// Check if MediaList loads on mount via pull-refresh download
console.log('MediaList mounted empty?', /mounted:function\(\)\{\s*\}/.test(media))
