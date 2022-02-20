import {escape, trim3} from './deps.js'

export const zjevkoToHtml = (zjevko) => {
  const {subjevkos, suffix} = zjevko

  if (subjevkos.length === 0) {
    if (suffix === '') return `<span class="null">${escape(suffix)}</span>`
    // note: || float64 is not correct
    const type = sigilToType[suffix[0]] || 'float64'
    return `<span class="${type}">${escape(suffix)}</span>`
  }

  const {prefix, jevko} = subjevkos[0]
  const type = sigilToType[prefix[0]] || 'float64'
  let ret = `<span class="${type}">`
  if (type === 'object') {
    const [pre, mid, post] = trim3(prefix.slice(1))
    ret += `${prefix[0]}${pre}<span class="key">${escape(mid)}</span>${post}[${zjevkoToHtml(jevko)}]`
    for (let i = 1; i < subjevkos.length; ++i) {
      const {prefix, jevko} = subjevkos[i]
      const [pre, mid, post] = trim3(prefix)
      ret += `${pre}<span class="key">${escape(mid)}</span>${post}[${zjevkoToHtml(jevko)}]`
    }
  }
  else for (const {prefix, jevko} of subjevkos) {
    ret += `${escape(prefix)}[${zjevkoToHtml(jevko)}]`
  }
  return ret + `${suffix}</span>`
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