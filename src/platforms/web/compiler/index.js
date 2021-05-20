/* @flow */

import { baseOptions } from './options'
import { createCompiler } from 'compiler/index'

// 通过平台配置获取compile
const { compile, compileToFunctions } = createCompiler(baseOptions)

export { compile, compileToFunctions }
