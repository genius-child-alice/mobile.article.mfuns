import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('.local/m.mfuns.net/m.mfuns.net/_nuxt')
for (const name of fs.readdirSync(dir)) {
  if (!name.endsWith('.js')) continue
  const t = fs.readFileSync(path.join(dir, name), 'utf8')
  if (!t.includes('name:"TimeLine"')) continue
  const idx = t.indexOf('name:"TimeLine"')
  console.log('===', name, '===')
  console.log(t.slice(idx, idx + 3500))
}
