import fs from 'fs'
const s = fs.readFileSync('.local/m.mfuns.net/m.mfuns.net/_nuxt/6c47532.js', 'utf8')
const key = '599:function'
const i = s.indexOf(key)
console.log('module 599 at', i)
const chunk = s.slice(i, i + 25000)
const renderStart = chunk.indexOf('component=Object')
console.log('render at', renderStart)
fs.writeFileSync('scripts/_contentbar.txt', chunk.slice(renderStart, renderStart + 12000))
