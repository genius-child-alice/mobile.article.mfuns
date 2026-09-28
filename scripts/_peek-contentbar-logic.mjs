import fs from 'fs'
const s = fs.readFileSync('.local/m.mfuns.net/m.mfuns.net/_nuxt/6c47532.js', 'utf8')
const i = s.indexOf('599:function')
const chunk = s.slice(i, i + 4500)
fs.writeFileSync('scripts/_contentbar-logic.txt', chunk)
