import {parseJevko, assertEquals, assert} from './devDeps.js'

import { sjevkoToSchema, schemaToSjevko, jevkoBySchemaToVerified } from './mod.js'

import {jevkoToPrettyString} from './deps.js'

const {test} = Deno

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

const schema = sjevkoToSchema(parseJevko(schemaStr))

test('sjevkoToSchema', () => {
  assertEquals(schema.props[' padded '].type, 'string')
})

const sjevkoStr = jevkoToPrettyString(schemaToSjevko(schema))

test('schemaToSjevko', () => {
  assert(sjevkoStr.includes('| padded | [string]'))
})

const jevko = parseJevko(`
- [last modified 1 April 2001 by John Doe]
owner [
  name [John Doe]
  organization [Acme Widgets Inc.]
]

database [
  - [use IP address in case network name resolution is not working]
  server [192.0.2.62]
  port [143]
  file [payroll.dat]
  select columns [[name][address][phone number]]
]
`)

test('jevkoBySchemaToVerified', () => {
  const verified = jevkoBySchemaToVerified(jevko, schema)

  assertEquals(verified.schema.type, 'object')
  assertEquals(verified.jevko.subjevkos.length, 3)
  assertEquals(verified.items[0].ignored, true)
})