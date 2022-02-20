import {escape, trim3, argsToJevko} from './deps.js'

export const zjevkoToDjevko = (zjevko) => {
  return argsToJevko(...recur(zjevko))
}

const recur = (zjevko) => {
  const {subjevkos, suffix} = zjevko

  if (subjevkos.length === 0) {
    if (suffix === '') return ["span", ["class=", ["null"], [suffix]]] // `<span class="null">${escape(suffix)}</span>`
    // note: || float64 is not correct
    const type = sigilToType[suffix[0]] || 'float64'
    return ["span", ["class=", [type], [suffix]]]
    // return `<span class="${type}">${escape(suffix)}</span>`
  }

  const {prefix, jevko} = subjevkos[0]
  const type = sigilToType[prefix[0]] || 'float64'
  let ret = [] // `<span class="${type}">`
  if (type === 'object') {
    const [pre, mid, post] = trim3(prefix.slice(1))
    ret.push([prefix[0] + pre], "span", ["class=", ["key"], [mid]], [post], ["["], ...recur(jevko), ["]"])
    // ret += `${prefix[0]}${pre}<span class="key">${escape(mid)}</span>${post}[${zjevkoToHtml(jevko)}]`
    for (let i = 1; i < subjevkos.length; ++i) {
      const {prefix, jevko} = subjevkos[i]
      const [pre, mid, post] = trim3(prefix)
      ret.push([pre], "span", ["class=", ["key"], [mid]], [post], ["["], ...recur(jevko), ["]"])
      // ret += `${pre}<span class="key">${escape(mid)}</span>${post}[${zjevkoToHtml(jevko)}]`
    }
  }
  else for (const {prefix, jevko} of subjevkos) {
    ret.push([prefix], ["["], ...recur(jevko), ["]"])
    // ret += `${escape(prefix)}[${recur(jevko)}]`
  }
  return ["span", ["class=", [type], ...ret, [suffix]]]
  // return ret + `${suffix}</span>`
}

const sigilToType = {
  ':': 'object',
  '.': 'tuple',
  '*': 'array',
  "'": 'string',
  'n': 'null',
  't': 'boolean',
  'f': 'boolean',
}