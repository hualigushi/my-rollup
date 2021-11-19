let acorn = require('acorn');
const walk = require('./walk');

// parse方法转换成抽象语法树
const astTree = acorn.parse(`import $ from 'jquery';`,{
    locations: true,
    ranges: true,
    sourceType: 'module',
    ecmaVersion: 8
});

let ident = 0;
const padding = () => " ".repeat(ident);

// 遍历语法树中的每一条语句
astTree.body.forEach(statement => {
    // 每一条传递给walk方法，由walk遍历这条语句的子元素
    // 深度优先进行遍历
    walk(statement, {
        enter(node) {
            if (node.type) {
                console.log(padding() + node.type)
                ident += 2
            }
        },
        leave(node) {
            if (node.type) {
                ident -= 2
                console.log(padding() + node.type)
            }
        }
    })
})