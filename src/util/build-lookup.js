const fs = require('node:fs')
const path = require('node:path')

const lookup = require('../lookup')

const folder = path.resolve(__dirname, '../../build/data')
const file = path.resolve(folder, 'lookup.json')

console.log(folder)

if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder,  { recursive: true })
}

fs.writeFileSync(file, JSON.stringify(lookup), 'utf8')