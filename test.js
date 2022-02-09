import {parseJevko} from './devDeps.js'

import { jevkoToSchema, schemaToJevko } from './mod.js'

import {jevkoToPrettyString} from './deps.js'

const schemaStr = `
owner [
  name [string]
  organization [string]
  object
]

database [
  - [use IP address in case network name resolution is not working]
  server [string]
  port [float64]
  file [string]
  select columns [[string]array]
  object
]
| padded [string]
object
`

const schema = jevkoToSchema(parseJevko(schemaStr))

console.assert(schema.props[' padded '].type === 'string')

const jevkoStr = jevkoToPrettyString(schemaToJevko(schema))

console.assert(jevkoStr.includes('| padded | [string]'))