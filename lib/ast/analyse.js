
function analyse(ast, magicString, module) {
    ast.body.forEach(statement => {
        Object.defineProperties(statement, {
            _source: {
                // start 指的是此节点在源代码中的起始索引，end就是结束索引
                value: magicString.snip(statement.start, statement.end),
            }
        })
    })
}
module.exports = analyse;