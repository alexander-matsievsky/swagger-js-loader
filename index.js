const fs = require('fs')
const {getOptions} = require('loader-utils')
const {URL} = require('url')

module.exports = function (source) {
  const options = getOptions(this)
  const url = new URL(options.url)
  // language=JavaScript
  return `
    import Swagger from 'swagger-client'
    // noinspection JSUnusedGlobalSymbols
    export default new Swagger('${url.toString()}')
  `
}
