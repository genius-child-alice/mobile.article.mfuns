import fs from 'fs'
const s = fs.readFileSync('.local/m.mfuns.net/m.mfuns.net/_nuxt/6c47532.js', 'utf8')
const marker = 'imagesMax'
const i = s.indexOf(marker)
console.log('at', i)
// find component render start backwards
const slice = s.slice(i - 8000, i + 6000)
fs.writeFileSync('scripts/_feed-card-full.txt', slice)
