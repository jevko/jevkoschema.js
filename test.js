import {parseJevko} from 'parsejevko.js'

import { jevkoToSchema } from './mod.js'

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