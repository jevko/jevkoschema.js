import { jevkoBySchemaToVerified } from "./jevkoBySchemaToVerified.js"

export const zipWithSchema = (jevko0, schema0) => {
  const verified = jevkoBySchemaToVerified(jevko0, schema0)

  return recur(verified)
}

const recur = (verified) => {
  const {schema, jevko} = verified

  const {type} = schema

  const sigil = typeToSigil[type] || ''

  const {subjevkos, suffix} = jevko

  if (subjevkos.length === 0) return {subjevkos, suffix: sigil + suffix}

  const {items} = verified

  let i = 0
  const {prefix, jevko: j} = subjevkos[i]
  const item = items[i]
  const mapped = [{prefix: sigil + prefix, jevko: item.ignored? j: recur(item.value)}]
  ++i
  for (; i < subjevkos.length; ++i) {
    const {prefix, jevko} = subjevkos[i]
    if (items[i].ignored === true) {
      mapped.push({prefix, jevko})
    } else mapped.push({prefix, jevko: recur(items[i].value)})
  }

  return {subjevkos: mapped, suffix}
}

const typeToSigil = {
  object: ':',
  array: '*',
  tuple: '.',
  string: "'"
}