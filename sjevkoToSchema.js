import {trim3} from './deps.js'

/**
 * converts a jevko which represents an interschema value to an interschema value
 * @param {*} jevko 
 * @returns 
 */
export const sjevkoToSchema = (jevko) => {
  const {subjevkos, suffix} = jevko
  const type = suffix.trim()

  if (['string', 'float64', 'boolean', 'empty', 'null'].includes(type)) {
    if (subjevkos.length > 0) throw Error('subs > 0 in primitive type')
    return {type}
  }
  if (type === 'array') return toArray(jevko)
  if (type === 'tuple') return toTuple(jevko)
  if (type === 'first match') return toFirstMatch(jevko)
  if (type === 'object') return toObject(jevko)
  // todo: or infer
  throw Error(`Unknown type (${type})`)
}

const toArray = (jevko) => {
  const {subjevkos, suffix} = jevko
  if (subjevkos.length !== 1) throw Error('subs !== 1 in array')
  const {prefix, jevko: j} = subjevkos[0]
  if (prefix.trim() !== '') throw Error('empty prefix expected')
  return {
    type: 'array',
    itemSchema: sjevkoToSchema(j)
  }
}

const toTuple = (jevko) => {
  const {subjevkos, suffix} = jevko
  // note: allows empty tuple
  const itemSchemas = []
  for (const {prefix, jevko} of subjevkos) {
    if (prefix.trim() !== '') throw Error('empty prefix expected')
    itemSchemas.push(sjevkoToSchema(jevko))
  }
  return {
    type: 'tuple',
    itemSchemas,
  }
}

const toFirstMatch = (jevko) => {
  const {subjevkos, suffix} = jevko
  // note: allows empty alternatives
  const alternatives = []
  for (const {prefix, jevko} of subjevkos) {
    if (prefix.trim() !== '') throw Error('empty prefix expected')
    alternatives.push(sjevkoToSchema(jevko))
  }
  return {
    type: 'first match',
    alternatives,
  }
}

const toObject = (jevko) => {
  const {subjevkos, suffix} = jevko

  const props = Object.create(null)
  for (const {prefix, jevko} of subjevkos) {
    const [pre, mid, post] = trim3(prefix)
    if (mid === '') throw Error('empty key')
    // entries with keys prefixed with '-' are ignored
    // this way they can be temporarily suppressed or serve as comments
    if (mid.startsWith('-')) continue
    // keys prefixed with '|' are taken verbatim -- no trimming
    // for use with unusual keys
    const key = mid.startsWith('|')? mid.slice(1) + post: mid
    if (key in props) throw Error('duplicate key')
    props[key] = sjevkoToSchema(jevko)
  }

  return {
    type: 'object',
    props,
  }
}
