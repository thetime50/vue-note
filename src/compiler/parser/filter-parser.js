/* @flow */

const validDivisionCharRE = /[\w).+\-_$\]]/

// exp 获取到的属性值的部分
export function parseFilters (exp: string): string {
  let inSingle = false
  let inDouble = false
  let inTemplateString = false
  let inRegex = false // 正则
  let curly = 0
  let square = 0
  let paren = 0
  let lastFilterIndex = 0
  let c, prev, i, expression, filters

  for (i = 0; i < exp.length; i++) {
    prev = c
    c = exp.charCodeAt(i)
    if (inSingle) {
      if (c === 0x27 && prev !== 0x5C) inSingle = false // \' 字符串结束
    } else if (inDouble) {
      if (c === 0x22 && prev !== 0x5C) inDouble = false // \" 字符串结束
    } else if (inTemplateString) {
      if (c === 0x60 && prev !== 0x5C) inTemplateString = false // \` 字符串结束
    } else if (inRegex) {
      if (c === 0x2f && prev !== 0x5C) inRegex = false // \/ 正则结束
    } else if (
      c === 0x7C && // pipe // |
      exp.charCodeAt(i + 1) !== 0x7C &&
      exp.charCodeAt(i - 1) !== 0x7C &&
      !curly && !square && !paren // 过滤器区间内未配对的括号
    ) { // | 不在各种括号里是是作为管道运算符(过滤器)
      if (expression === undefined) {
        // first filter, end of expression
        lastFilterIndex = i + 1
        expression = exp.slice(0, i).trim() // 获取到过滤器之前的表达式字符串
      } else {
        pushFilter()
      }
    } else {
      switch (c) {
        case 0x22: inDouble = true; break         // "
        case 0x27: inSingle = true; break         // '
        case 0x60: inTemplateString = true; break // `
        case 0x28: paren++; break                 // (
        case 0x29: paren--; break                 // )
        case 0x5B: square++; break                // [
        case 0x5D: square--; break                // ]
        case 0x7B: curly++; break                 // {
        case 0x7D: curly--; break                 // }
      }
      if (c === 0x2f) { // / ???
        let j = i - 1
        let p
        // find first non-whitespace prev char
        for (; j >= 0; j--) { // 为什么要往前找???
          p = exp.charAt(j)
          if (p !== ' ') break
        }
        if (!p || !validDivisionCharRE.test(p)) { // p是空白字符 或者 p不是(表达式\) 成员运算符\. 变量字符)
          inRegex = true // 开始正则
        }
      }
    }
  }

  if (expression === undefined) { // 
    expression = exp.slice(0, i).trim() // 仅有一个表达式
  } else if (lastFilterIndex !== 0) {
    pushFilter() // 处理最后一个fliter
  }

  function pushFilter () {
    (filters || (filters = [])).push(exp.slice(lastFilterIndex, i).trim()) // 按过滤器规则 | 分割数组
    lastFilterIndex = i + 1
  }

  if (filters) {
    for (i = 0; i < filters.length; i++) {
      expression = wrapFilter(expression, filters[i]) // 拼接过滤器函数字符串
    }
  }

  return expression
}

function wrapFilter (exp: string, filter: string): string {
  const i = filter.indexOf('(')
  if (i < 0) {
    // _f: resolveFilter
    return `_f("${filter}")(${exp})`
  } else {
    const name = filter.slice(0, i)
    const args = filter.slice(i + 1)
    return `_f("${name}")(${exp}${args !== ')' ? ',' + args : args}`
  }
}
