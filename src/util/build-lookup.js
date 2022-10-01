const fs = require('node:fs')
const path = require('node:path')

/** @type {Array} */
const lookup = require('../lookup')

const folder = path.resolve(__dirname, '../../build/data')
console.log(folder)

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder,  { recursive: true })
}

Object.keys(lookup)?.forEach((type) => {
    fs.writeFileSync(path.resolve(folder, `lookup-${type}.json`), JSON.stringify(lookup[type]), 'utf8')
})
