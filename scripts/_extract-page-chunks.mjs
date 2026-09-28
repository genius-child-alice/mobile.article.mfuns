import fs from 'fs'
import path from 'path'

const nuxt = '.local/m.mfuns.net/m.mfuns.net/_nuxt'
const files = {
  media: '7ad8765.js',
  mylist: 'f734d65.js',
  sign: 'bed0526.js',
  blackroom: '7f0da3a.js',
  sign_rank: '56daa3e.js',
}

function prettyExtract(name, file) {
  const s = fs.readFileSync(path.join(nuxt, file), 'utf8')
  console.log('\n##########', name, file, 'len', s.length, '##########')

  // API-like strings
  const apis = [...s.matchAll(/["'`](\/(?:media|favorite|sign|member|playlist|blackroom|user|ban|punish)[^"'`]*)["'`]/g)].map(m => m[1])
  console.log('API-ish paths:', [...new Set(apis)])

  // Chinese UI strings
  const zh = [...s.matchAll(/["'`]([^"'`]{0,40}[\u4e00-\u9fff][^"'`]{0,60})["'`]/g)].map(m => m[1])
  console.log('ZH strings sample:', [...new Set(zh)].slice(0, 80))

  // route names / components
  const routes = [...s.matchAll(/name\s*:\s*["']([^"']+)["']/g)].map(m => m[1])
  console.log('name fields:', [...new Set(routes)].slice(0, 40))

  // $axios / api calls patterns
  const axiosCalls = [...s.matchAll(/\$axios[^;]{0,200}/g)].map(m => m[0].slice(0, 180))
  console.log('axios snippets:', axiosCalls.slice(0, 20))

  const getPost = [...s.matchAll(/\.(?:\$get|\$post|get|post)\(([^)]{0,120})\)/g)].map(m => m[0].slice(0, 150))
  console.log('get/post:', [...new Set(getPost)].slice(0, 40))

  // methods / data keys
  const dataKeys = [...s.matchAll(/data\s*:\s*function\s*\(\)\s*\{return\s*\{([^}]{0,800})\}/g)]
  if (dataKeys[0]) console.log('data():', dataKeys[0][1].slice(0, 800))

  // middleware
  if (s.includes('middleware')) {
    const mw = [...s.matchAll(/middleware\s*:\s*("[^"]+"|'[^']+'|\[[^\]]+\])/g)].map(m => m[1])
    console.log('middleware:', mw)
  }

  // Write pretty-ish by splitting on ; for inspection file
  const out = path.join('scripts', `_chunk-${name}.txt`)
  // Insert newlines after ; and { for readability, truncated
  let pretty = s
  pretty = pretty.replace(/;/g, ';\n').replace(/\{/g, '{\n').replace(/,/g, ',\n')
  fs.writeFileSync(out, pretty.slice(0, 250000))
  console.log('wrote', out, 'preview chars', Math.min(pretty.length, 250000))
}

for (const [k, f] of Object.entries(files)) prettyExtract(k, f)

// also find playlist-related other chunks referenced from mylist
const mylist = fs.readFileSync(path.join(nuxt, files.mylist), 'utf8')
const imports = [...mylist.matchAll(/"([a-f0-9]{7})"/g)].map(m => m[1] + '.js')
console.log('\nmylist imported chunk ids:', [...new Set(imports)].slice(0, 30))

// search all _nuxt for playlist/blackroom/sign routes
const dir = fs.readdirSync(nuxt).filter(f => f.endsWith('.js'))
const hits = []
for (const f of dir) {
  const s = fs.readFileSync(path.join(nuxt, f), 'utf8')
  if (/playlist\/|blackroom|sign_rank|\/media\/|MediaPage|SignPage|BlackRoom|MyList|FavoriteList/.test(s)) {
    if (['7ad8765.js','f734d65.js','bed0526.js','7f0da3a.js','56daa3e.js'].includes(f)) continue
    // only if strong match
    if (/pages[\\/](media|playlist|member[\\/]sign|blackroom)/.test(s) || /routePath.*(?:media|playlist|sign|blackroom)/.test(s) || /"\/media\/"|\"\/playlist\/mylist\"|\"\/member\/sign\"|\"\/blackroom/.test(s)) {
      hits.push(f)
    }
  }
}
console.log('other related chunks:', hits.slice(0, 40))
