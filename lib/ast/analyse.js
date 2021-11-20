let Scope = require('./scope')
const walk = require('./walk')
/**
 * 找出当前模块使用了哪些变量
 * 还是知道哪些变量是当前模块的，哪些变量是从别的模块导入的
 * @param {*} ast 语法树
 * @param {*} magicString 源代码
 * @param {*} module 属于哪个模块
 */
function analyse(ast, magicString, module) {
    let scope = new Scope() // 创建一个模块内的全局作用域
    // 遍历当前语法树的所有顶级节点
    ast.body.forEach(statement => {
        // 给作用域添加变量
        function addToScope(declaration) {
            let name = declaration.id.name; // 获得这个声明的变量
            scope.add(name) // 把变量添加到当前的全局作用域
            if (!scope.parent) { // 如果是当前全局作用域的话
                statement._defines[name] = true // 在全局作用域下声明一个全局的变量
            }
        }
        Object.defineProperties(statement, {
            _defines: { value: {} }, // 存放当前模块定义的所有的全局变量
            _dependOn: { value: {} }, // 当前模块没有定义但是使用到的变量，也就是依赖的外部变量 
            _included: { // 此语句是否已经被包含到打包结果中了
                value: false,
                writable: true
            },
            _source: {
                // start 指的是此节点在源代码中的起始索引，end就是结束索引
                value: magicString.snip(statement.start, statement.end),
            }
        })

        // 构建作用域
        walk(statement, {
            enter(node) {
                let newScope
                switch (node.type) {
                    case 'FunctionDeclaration':
                        const params = node.params.map(x => x.name)
                        if (node.type === 'FunctionDeclaration') {
                            addToScope(node)
                        }
                        newScope = new Scope({
                            parent: scope, // 副作用就是当前域
                            params
                        })
                        break;
                    case 'VariableDeclaration':
                        node.declarations.forEach(addToScope)
                        break;
                }
                if (newScope) { // 当前节点声明一个新的作用域
                    // 此节点的_scope指向新的作用域
                    Object.defineProperty(node, '_scope', { value: newScope })
                    scope = newScope
                }
            },
            leave(node) {
                if (node._scope) { // 如果此节点产生了一个新的作用域，则离开此节点后，scope回到父作用域
                    scope = scope.parent
                }
            }
        })
    })
    ast._scope = scope
    // 找出外部依赖的_dependOn
    ast.body.forEach(statement => {
        walk(statement, {
            enter(node) {
                if (node._scope) {
                    scope = node._scope
                }
                if (node.type === 'Identifier') {
                    // 从当前作用域向上递归，找这个变量在哪个作用域
                    const definingScope = scope.findDefiningScope(node.name)
                    if (!definingScope) {
                        statement._dependOn[node.name] = true // 这是一个外部依赖的变量
                    }
                }
            },
            leave(node) {
                if (node._scope) {
                    scope = scope.parent
                }
            }
        })
    })
}
module.exports = analyse;