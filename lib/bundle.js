const fs = require('fs');
const { default: MagicString } = require('magic-string');
let Module = require('./module');

class Bundle{
    constructor(options){
        // 文件后缀名处理
        this.entryPath = options.entry.replace(/.js$/,'')+'.js';
        // 存放所有的模块，入口文件和它依赖的模块
        this.modules = {} 
    }

    build(outputFileName){
        // 从入口文件的绝对路径出发，找到它的的模块定义
        let entryModule = this.fetchModule(this.entryPath)
        // 把入口模块所有的语句进行展开，返回所有语句组成的数组
        this.statements = entryModule.expandAllStatements()
        const {code} = this.generate()
        fs.writeFileSync(outputFileName,code,'utf8')
    }

    // 获取模块信息
    fetchModule(importee){
        let route = importee; // 入口文件的绝对路径
        if(route){
            // 从硬盘上读出此模块的源代码
            const code = fs.readFileSync(route,'utf8')
            let module = new Module({
                code, // 模块的源代码
                path: route, // 模块的绝对路径
                bundle: this, // 属于哪个Bundle
            })
            return module
        }
    }

    // 把this.statemente生成代码
    generate(){
        let magicString = new MagicString.Bundle()
        this.statements.forEach(statement=>{
            const source = statement._source.clone()
            magicString.addSource({
                content: source,
                seprator:'\n'
            })
        })
        return {code: magicString.toString()}
    }
}
module.exports = Bundle