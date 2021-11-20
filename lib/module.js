let MagicString = require('magic-string');

const { parse } = require('acorn');
const analyse = require('./ast/analyse');

// 判断obj上是否有Prop属性
function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop)
}
/**
 * 每个文件都是一个模块，每个模块都会对应一个Module实例
 */
class Module {
    constructor({ code, path, bundle }) {
        this.code = new MagicString(code, {
            fileName: path
        })
        this.path = path; // 模块的绝对路径
        this.bundle = bundle; // 属于哪个Bundle
        this.ast = parse(code, { // 把源代码转成抽象语法树
            ecmaVersion: 7,
            sourceType: 'module'
        });
        this.analyse();
    }

    analyse() {
        this.imports = {} // 存放当前模块的导入
        this.exports = {} // 存放当前模块的导出
        this.ast.body.forEach(node => {
            if (node.type === 'ImportDeclaration') { // 说明这是一个导入语句
                let source = node.source.value;// 从哪个模块导入的
                let specifiers = node.specifiers;
                specifiers.forEach(specifier => {
                    const name = specifier.imported.name;
                    const localName = specifier.local.name;
                    // 本地的哪个变量，是从哪个模块的哪个变量导出的
                    // this.imports.age = {
                    //     name : 'age',
                    //     localName: 'age',
                    //     source: './msg'
                    // }
                    this.imports[localName] = {
                        name,
                        localName,
                        source
                    }
                })
            } else if (node.type === 'ExportNamedDeclaration') {
                let declaration = node.declaration;
                if (declaration.type === 'VariableDeclaration') {
                    let name = declaration.declarations[0].id.name;
                    // 记录当前模块的导出
                    this.exports[name] = {
                        name,
                        localName: name,
                        expression: declaration
                    }
                }
            }
        })
        analyse(this.ast, this.code, this);
        this.definations = {} // 存放所有全局变量的定义语句
        this.ast.body.forEach(statement => {
            Object.keys(statement._defines).forEach(name => {
                this.definations[name] = statement
            })
        })
    }

    // 展开这个模块里的语句，把这些语句中定义的变量的语句都放到结果中
    expandAllStatements() {
        let allStatements = []
        this.ast.body.forEach(statement => {
            if (statement.type === 'ImportDeclaration') {
                return
            }
            let statements = this.expandStatement(statement)
            allStatements.push(...statements)
        })
        return allStatements
    }

    // 展开一个节点
    // 找到当前节点依赖的变量，它访问的变量，找到这些变量的声明语句
    expandStatement(statement) {
        let result = []
        const dependencies = Object.keys(statement._dependOn) // 外部依赖
        dependencies.forEach(name => {
            // 找到定义这个变量的声明节点，可能在当前模块内，也可能在依赖的模块内
            let definition = this.define(name)
            result.push(...definition)
        })
        if (!statement._included) {
            statement._included = true; // 表示这个节点已经确定被纳入结果了，以后就不需要重复添加了
            // treeshaking 的核心
            result.push(statement)
        }
        return result
    }

    define(name) {
        // 查找一下导入变量里有没有name
        if (hasOwnProperty(this.imports, name)) {
            const importData = this.imports[name]
            const module = this.bundle.fetchModule(importData.source, this.path)
            const exportData = module.exports[importData.name]
            return module.define(exportData.localName)
        } else {
            let statement = this.definations[name]
            if (statement && !statement._included) {
                return this.expandStatement(statement)
            } else {
                return []
            }
        }
    }
}
module.exports = Module