import fs from 'node:fs'
import path from 'node:path'

const dir = path.resolve('.local/m.mfuns.net/m.mfuns.net/_nuxt')
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const t = fs.readFileSync(path.join(dir, f), 'utf8')
  if (!t.includes('MemberCard')) continue
  const i = t.indexOf('name:"MemberCard"')
  if (i >= 0) {
    console.log(f)
    console.log(t.slice(i, i + 4000))
    break
  }
}
