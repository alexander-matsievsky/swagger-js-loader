const fs = require('fs')

function type (value) {
  if (value.enum)
    return value.enum.map(JSON.stringify).join('|')
  if (value.oneOf)
    return value.oneOf.map(type).join('|')
  if (value.allOf)
    return value.allOf.map(type).join('&')
  if (value.$ref)
    return value.$ref.split('/').slice(-1)[0]
  switch (value.type) {
    case 'boolean':
      return 'boolean'
    case 'string':
      return 'string'
    case 'integer':
    case 'number':
      return 'number'
    case 'array':
      return type(value.items) + '[]'
    case 'object':
      const required = new Set(value.required)
      return '{' + Object.entries(value.properties || {})
        .map(([k, v]) => `${k}${required.has(k) ? '' : '?'}:${type(v)}`)
        .join(',\n') + '}'
  }
}

function parameter (value) {
  if (value.$ref)
    return `P${value.$ref.split('/').slice(-1)[0]}`
  else
    return `{${value.name}${value.required ? '' : '?'}:${
      value.schema ? type(value.schema) : value.type}}`
}

function response ([status, value]) {
  if (value.$ref && value.$ref.indexOf('#/definitions') === 0)
    return `{\nstatus:${status},body:${value.$ref.split('/').slice(-1)[0]}}`
  else
    return `{\nstatus:${status},body:${value.schema
      ? type(value.schema)
      : 'void'}}`
}

function definitions (swagger) {
  return Object.entries(swagger.definitions)
    .sort(([$1], [$2]) => $1.localeCompare($2))
    .map(([k, v]) => `\nexport type ${k}=${type(v)}`).join('')
}

function parameters (swagger) {
  return Object.entries(swagger.parameters)
    .sort(([$1], [$2]) => $1.localeCompare($2))
    .map(([k, v]) =>
      `\nexport type P${k}={\n${v.name}${v.required ? '' : '?'}:${
        type(v.schema || v)}}`)
    .join('')
}

function paths (swagger) {
  const operations = Object.values(swagger.paths)
    .reduce((operations, path) => operations.concat(Object.values(path)), [])
    .reduce((operations, operation) => {
      for (const tag of (operation.tags || ['default'])) {
        operations[tag] = operations[tag] || {}
        operations[tag][operation.operationId] = operation
      }
      return operations
    }, {})
  return 'export type Client = {\napis:{' +
    Object.entries(operations).map(([tag, operations]) => {
      return `\n${tag}:{` + Object.entries(operations)
        .sort(([$1], [$2]) => $1.localeCompare($2))
        .map(([operationId, operation]) => {
          return `\n${operationId}(${
            (operation.parameters || []).map(parameter).join('&')
            }): Promise<${
            Object.entries(operation.responses)
              .filter(([code]) => code !== 'default')
              .map(response).join('|')
            }>`
        }).join(';\n') + '}'
    }).join(',') +
    '}}'
}

void async function main () {
  process.stdin
    .pipe(fs.createWriteStream('/tmp/swagger.json'))
    .on('close', () => {
      const swagger = require('/tmp/swagger.json')
      // language=Flow JS
      console.log(`
// @flow

import Swagger from 'swagger-client'

const client: Promise<Client> = new Swagger('${process.argv[2]}')
export default client

${paths(swagger)}

${definitions(swagger)}

${parameters(swagger)}
    `)
    })
}()
