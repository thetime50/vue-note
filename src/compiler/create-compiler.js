/* @flow */

import { extend } from 'shared/util'
import { detectErrors } from './error-detector'
import { createCompileToFunctionFn } from './to-function'


export function createCompilerCreator (baseCompile: Function): Function {
  return function createCompiler (baseOptions: CompilerOptions) {// 对应 p:src\platforms\web\compiler\index.js 的const { compile, compileToFunctions } = createCompiler(baseOptions)
    function compile ( // baseCompile加工
      template: string,
      options?: CompilerOptions
    ): CompiledResult {
      const finalOptions = Object.create(baseOptions)
      const errors = []
      const tips = []

      let warn = (msg, range, tip) => {
        (tip ? tips : errors).push(msg)
      }

      // 覆盖默认配置处理
      if (options) {
        if (process.env.NODE_ENV !== 'production' && options.outputSourceRange) {
          // $flow-disable-line
          const leadingSpaceLength = template.match(/^\s*/)[0].length

          warn = (msg, range, tip) => { // 生产模式替换报警函数
            const data: WarningMessage = { msg }
            if (range) {
              // 报警函数嵌套退格处理
              if (range.start != null) {
                data.start = range.start + leadingSpaceLength
              }
              if (range.end != null) {
                data.end = range.end + leadingSpaceLength
              }
            }
            (tip ? tips : errors).push(data)
          }
        }
        // merge custom modules
        // 添加配置的modules
        if (options.modules) {
          finalOptions.modules =
            (baseOptions.modules || []).concat(options.modules)
        }
        // merge custom directives
        // 添加配置的分隔符??
        if (options.directives) {
          finalOptions.directives = extend(
            Object.create(baseOptions.directives || null),
            options.directives
          )
        }
        // copy other options
        for (const key in options) {
          if (key !== 'modules' && key !== 'directives') {
            finalOptions[key] = options[key]
          }
        }
      }

      finalOptions.warn = warn

      const compiled = baseCompile(template.trim(), finalOptions)//得到 ast render staticRenderFns 这里就是执行了最初传入的baseCompile
      if (process.env.NODE_ENV !== 'production') {
        detectErrors(compiled.ast, warn)
      }
      compiled.errors = errors
      compiled.tips = tips
      return compiled
    }

    return {
      compile, // todo 这个compile出来的肯是个code // createCompilerCreator createCompiler 包装 baseCompile
      // compile再加工
      // 扩展参数 格式为( template,options,vm )
      // 编译template 并从code字符串构造rander函数
      compileToFunctions: createCompileToFunctionFn(compile) //createCompileToFunctionFn createCompilerCreator createCompiler 包装 baseCompile
     
    }
  }
}
