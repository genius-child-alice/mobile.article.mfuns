import fs from 'fs'
import path from 'path'

const base = '.local/m.mfuns.net/m.mfuns.net'
const pages = ['media', 'playlist/mylist', 'member/sign', 'blackroom', 'member/sign_rank']

for (const p of pages) {
  const html = fs.readFileSync(path.join(base, p, 'index.html'), 'utf8')
  console.log('\n========', p, 'len', html.length, '========')
  const chunks = [...html.matchAll(/\/_nuxt\/([a-f0-9]+\.js)/g)].map((m) => m[1])
  console.log('chunks', [...new Set(chunks)])
  const title = (html.match(/<title[^>]*>([^<]*)</) || [])[1]
  console.log('title', title)

  const nuxtIdx = html.indexOf('window.__NUXT__')
  if (nuxtIdx >= 0) {
    const end = html.indexOf('</script>', nuxtIdx)
    const s = html.slice(nuxtIdx, Math.min(end, nuxtIdx + 4000))
    console.log('NUXT:', s.slice(0, 3500))
  } else {
    console.log('no __NUXT__')
  }

  const textBits = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  console.log('text sample:', textBits.slice(0, 1200))
}

const idx = JSON.parse(fs.readFileSync('.local/m.mfuns.net/routes-index.json', 'utf8'))
console.log('\nallPageRoutes related:')
for (const r of idx.allPageRoutes || []) {
  if (/media|playlist|sign|blackroom/i.test(String(r))) console.log(r)
}
console.log('\nstatic related:')
for (const r of idx.static || []) {
  if (/media|playlist|sign|blackroom/i.test(String(r))) console.log(r)
}
