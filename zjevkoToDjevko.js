import {trim3, argsToJevko} from './deps.js'

export const zjevkoToDjevko = (zjevko) => {
  return argsToJevko(...recur(zjevko))
}

const recur = (zjevko) => {
  const {subjevkos, suffix} = zjevko

  if (subjevkos.length === 0) {
    if (suffix === '') return ["span", ["class=", ["null"], [suffix]]]
    const type = sigilToType(suffix[0])
    return ["span", ["class=", [type], [suffix]]]
  }

  const {prefix, jevko} = subjevkos[0]
  const type = sigilToType(prefix[0])
  const ret = []
  if (type === 'object') {
    const [pre, mid, post] = trim3(prefix.slice(1))
    ret.push([prefix[0] + pre], "span", ["class=", ["key"], [mid]], [post], ["["], ...recur(jevko), ["]"])
    for (let i = 1; i < subjevkos.length; ++i) {
      const {prefix, jevko} = subjevkos[i]
      const [pre, mid, post] = trim3(prefix)
      ret.push([pre], "span", ["class=", ["key"], [mid]], [post], ["["], ...recur(jevko), ["]"])
    }
  }
  else for (const {prefix, jevko} of subjevkos) {
    ret.push([prefix], ["["], ...recur(jevko), ["]"])
  }
  return ["span", ["class=", [type], ...ret, [suffix]]]
}

const SigilToType = {
  ':': 'object',
  '.': 'tuple',
  '*': 'array',
  "'": 'string',
  'n': 'null',
  't': 'boolean',
  'f': 'boolean',
}

const sigilToType = (sigil) => {
  // note: || float64 is not correct
  return SigilToType[sigil] || 'float64' 
}