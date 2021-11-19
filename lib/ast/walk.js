/**
 * 遍历抽象语法树
 */
function walk (ast,{enter,leave}){
    visit(ast, null,enter,leave)
}
/**
 * 访问node节点
 * @param {} node 
 * @param {*} parent 
 * @param {*} enter 
 * @param {*} leave 
 */
function visit(node,parent,enter,leave){
    if(enter){
        enter(node,parent);
    }
    // 找出是对象的子节点
    const childKeys = Object.keys(node).filter(key=>typeof node[key]==='object')
    childKeys.forEach(childKey=>{
        let value = node[childKey];
        if(Array.isArray(value)){ // 遍历数组
            value.forEach(val=>visit(val,node,enter,leave))
        } else {
            visit(value,node,enter,leave)
        }
    })
    if(leave){
        leave(node,parent)
    }
}
module.exports = walk