const fs = require('node:fs')
const path = require('node:path')

/** @type {Array} */
const patternDefinitions = require('../lookup.js')

const folder = path.resolve(__dirname, '../../build/data')
console.log(folder)

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder,  { recursive: true })
}

Object.keys(patternDefinitions)?.forEach((type) => {
    fs.writeFileSync(path.resolve(folder, `pattern-${type}.json`), JSON.stringify(patternDefinitions[type]), 'utf8')
})
