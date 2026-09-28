import fs from 'fs'
const dir = '.local/m.mfuns.net/m.mfuns.net/_nuxt'
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8')
  if (!s.includes('name:"DynamicCard"') && !s.includes("name:'DynamicCard'")) continue
  const i = s.indexOf('name:"DynamicCard"')
  console.log('found', f, i)
  fs.writeFileSync('scripts/_dynamic-card.txt', s.slice(i, i + 15000))
  break
}
// also search FeedList or timeline list item
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8')
  if (s.includes('floor_count') && s.includes('member-info') && s.includes('dynamic-extra')) {
    console.log('combo', f, s.length)
  }
}
