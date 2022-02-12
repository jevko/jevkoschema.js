import {trim3, jevkoToString} from 'https://cdn.jsdelivr.net/gh/jevko/jevkoutils.js@v0.1.4/mod.js'

export const jevkoBySchemaToVerified = (jevko, schema) => {
  const {type} = schema
  if (type === 'string') return toString(jevko, schema)
  if (type === 'float64' || type === 'number') return toFloat64(jevko, schema)
  if (type === 'boolean') return toBoolean(jevko, schema)
  if (type === 'null') return toNull(jevko, schema)
  if (type === 'array') return toArray(jevko, schema)
  if (type === 'tuple') return toTuple(jevko, schema)
  if (type === 'object') return toObject(jevko, schema)
  if (type === 'first match') return toFirstMatch(jevko, schema)
  throw Error(`Unknown schema type ${type}`)
}

const toString = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (subjevkos.length > 0) throw Error('nonempty subjevkos in string')
  return {schema, jevko}
}

const toFloat64 = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (subjevkos.length > 0) throw Error('nonempty subjevkos in string')
  const trimmed = suffix.trim()
  if (trimmed === 'NaN') return {schema, jevko, trimmed, value: NaN}//`<span class="float64">NaN</span>`
  const value = Number(trimmed)
  if (Number.isNaN(value) || trimmed === '') throw Error(`Not a number (${trimmed})`)
  return {schema, jevko, trimmed, value}
  // return `<span class="float64">${num}</span>`
}

const toBoolean = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (subjevkos.length > 0) throw Error('nonempty subjevkos in string')
  const trimmed = suffix.trim()
  if (trimmed === 'true') return {schema, jevko, trimmed, value: true} //`<span class="boolean">true</span>`
  if (trimmed === 'false') return {schema, jevko, trimmed, value: false} //`<span class="boolean">false</span>`
  throw Error(`not a boolean (${suffix})`)
}

const toNull = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (subjevkos.length > 0) throw Error('nonempty subjevkos in string')
  const trimmed = suffix.trim()
  if (trimmed === 'null') return {schema, jevko, trimmed, value: null} //`<span class="null">null</span>`
  throw Error(`not a null (${suffix})`)
}

const toArray = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (suffix.trim() !== '') throw Error('suffix !== ""')
  let ret = ''
  const items = []
  const {itemSchema} = schema
  for (const {prefix, jevko} of subjevkos) {
    if (prefix.trim() !== '') throw Error(`nonempty prefix (${prefix})`)
    items.push({prefix, item: jevkoBySchemaToVerified(jevko, itemSchema)})
    // ret += `${prefix}[<span class="item">${vSchema(jevko, itemSchema)}</span>]`
  }
  return {schema, jevko, items} //`<span class="array">${ret}${suffix}</span>`
}

const toTuple = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (suffix.trim() !== '') throw Error('suffix !== ""')
  let ret = ''
  const items = []
  const {itemSchemas, isSealed} = schema
  if (itemSchemas.length > subjevkos.length) throw Error('bad tuple')
  if (isSealed && itemSchemas.length !== subjevkos.length) throw Error('also bad tuple')
  for (let i = 0; i < itemSchemas.length; ++i) {
    const {prefix, jevko} = subjevkos[i]
    if (prefix.trim() !== '') throw Error(`nonempty prefix (${prefix})`)
    items.push({prefix, item: jevkoBySchemaToVerified(jevko, itemSchemas[i])})
    // ret += `${prefix}[<span class="item">${vSchema(jevko, itemSchemas[i])}</span>]`
  }
  return {schema, jevko, items} //`<span class="tuple">${ret}${suffix}</span>`
}

const toObject = (jevko, schema) => {
  const {subjevkos, suffix} = jevko
  if (suffix.trim() !== '') throw Error('suffix !== ""')
  const keyJevkos = Object.create(null)
  let ret = ''
  const items = []
  const {optional = [], isSealed = true, props} = schema
  const keys = Object.keys(props)
  for (const {prefix, jevko} of subjevkos) {
    const [pre, key, post] = trim3(prefix)
    if (key.startsWith('-')) {
      items.push({prefix, ignored: true, jevkoStr: jevkoToString(jevko)})
      // ret += `<span class="ignored">${prefix}[${jevkoToString(jevko)}]</span>`
      continue
    }
    // todo: key starts with | -- use trim()
    if (key === '') throw Error('empty key')
    if (key in keyJevkos) throw Error('duplicate key')
    if (isSealed && keys.includes(key) === false) throw Error(`unknown key (${key}) ${post}`)
    items.push({prefix, pre, key, post, value: jevkoBySchemaToVerified(jevko, props[key])})
    // ret += `<span class="item">${pre}<span class="key">${key}</span>${post}[<span class="value">${vSchema(jevko, props[key])}</span>]</span>`
  }
  return {schema, jevko, items} //`<span class="object">${ret}${suffix}</span>`
}
const toFirstMatch = (jevko, schema) => {
  const {alternatives} = schema

  for (const alt of alternatives) {
    try {
      const x = jevkoBySchemaToVerified(jevko, alt)
      return x
    } catch (e) {
      continue
    }
  }
  throw Error('toFirstMatch: invalid jevko')
}