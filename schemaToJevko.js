import {trim3} from './deps.js'

export const schemaToJevko = (schema) => {
  const {type} = schema
  if (['string', 'float64', 'boolean', 'null'].includes(type)) {
    return {suffix: type, subjevkos: []}
  }
  if (type === 'array') return toArray(schema)
  if (type === 'tuple') return toTuple(schema)
  if (type === 'object') return toObject(schema)
  if (type === 'first match') return toFirstMatch(schema)
  throw Error(`Unknown schema type ${type}`)
}

const toArray = (schema) => {
  const {itemSchema} = schema
  return {suffix: 'array', subjevkos: [{prefix: '', jevko: schemaToJevko(itemSchema)}]}
}

const toTuple = (schema) => {
  // todo: support isSealed
  const {itemSchemas, isSealed} = schema
  return {
    suffix: 'tuple', 
    subjevkos: itemSchemas.map(s => ({prefix: '', jevko: schemaToJevko(s)}))
  }
}

const toObject = (schema) => {
  // todo: support isSealed, optional
  const {props, isSealed} = schema
  return {
    suffix: 'object', 
    subjevkos: Object.entries(props).map(([k, v]) => {
      let prefix = ''
      if (k === '') prefix = '|'
      else {
        const [pre, mid, post] = trim3(k)
        if (pre !== '') prefix += '|' + pre
        prefix += mid
        if (post !== '') prefix += post + '|'
      }
      return {prefix, jevko: schemaToJevko(v)}
    })
  }
}
const toFirstMatch = (schema) => {
  const {alternatives} = schema

  return {
    suffix: 'first match', 
    subjevkos: alternatives.map(s => ({prefix: '', jevko: schemaToJevko(s)}))
  }
}