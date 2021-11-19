const path = require('path')
const rollup = require('./lib/rollup') // 编译的入口文件

debugger
let entry = path.resolve(__dirname,'src/main.js')
rollup(entry, 'bundle.js')