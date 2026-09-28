import fs from 'node:fs'
import path from 'node:path'

const base = path.resolve('.local/m.mfuns.net/m.mfuns.net/_nuxt')

function dump(file, needle, len = 2200) {
  const t = fs.readFileSync(path.join(base, file), 'utf8')
  const i = t.indexOf(needle)
  console.log('\n====', file, needle, i)
  if (i >= 0) console.log(t.slice(i, i + len))
}

dump('5dba2dc.js', 'name:"SearchContent"')
dump('5dba2dc.js', 'methods:{search:function')
dump('1007e37.js', 'name:"SearchArticle"')
dump('3a128d5.js', 'name:"TagPage"')
dump('3a128d5.js', 'name:"ArticleTag"')
dump('3a128d5.js', 'name:"FeedTag"')
