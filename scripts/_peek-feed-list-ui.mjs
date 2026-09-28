import fs from 'fs'
const files = ['6c47532.js', '7f0cc03.js', '512b712.js', '9ddae97.js']
for (const f of files) {
  const p = `.local/m.mfuns.net/m.mfuns.net/_nuxt/${f}`
  if (!fs.existsSync(p)) continue
  const s = fs.readFileSync(p, 'utf8')
  const i = s.indexOf('floor_count')
  if (i < 0) continue
  console.log('===', f, 'floor_count at', i)
  fs.writeFileSync('scripts/_feed-card-ui.txt', s.slice(i - 3000, i + 4000))
  break
}
