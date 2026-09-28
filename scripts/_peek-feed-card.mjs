import fs from 'fs'
const dir = '.local/m.mfuns.net/m.mfuns.net/_nuxt'
const names = [
  'DynamicCard',
  'FeedCard',
  'FeedsCard',
  'FeedItem',
  'FeedsItem',
  'FeedList',
  'FeedsList',
  'TimelineFeed',
  'MobileFeeds',
]
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8')
  for (const name of names) {
    const key = `name:"${name}"`
    if (s.includes(key)) {
      const i = s.indexOf(key)
      console.log('HIT', name, f, i)
      if (name === 'FeedList' || name === 'DynamicCard' || name === 'FeedsList') {
        fs.writeFileSync(`scripts/_feed-${name}.txt`, s.slice(i, i + 12000))
      }
    }
  }
}
// timeline page module
for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.js'))) {
  const s = fs.readFileSync(`${dir}/${f}`, 'utf8')
  if (s.includes('new_reply_list') && s.includes('member-info') && s.includes('v-card')) {
    console.log('timeline-ish', f, s.length)
    const i = s.indexOf('member-info')
    fs.writeFileSync('scripts/_feed-timeline.txt', s.slice(Math.max(0, i - 500), i + 8000))
    break
  }
}
