// zwiftapp.js

// Build to an executable with yao-pkg:
// npx yao-pkg dummyapp.js
// Build to an executable with bun:
// bun build --compile dummyapp.js

// zwiftapp.exe can be used for testing the ZwiftMemoryMonitor
// easier and with less system impact than using Zwift itself

// takes a filename as argument
// loads the json file into an object dump
// if dump.buf is set, convert it from hex string to a buffer

// if dump.addresses.power and dump.bufStartAddress is set:
// Read power value from the buffer at baseaddress + dump.addresses.power[0] - bufstartaddress
// Every 500 ms:
// change the power value up or down by 3, never more than +-50 from the original value, never less than 0
// write the new power value to the buffer at the same location


const fs = require('fs')
const memoryjs = require('memoryjs')

let dump = {}
if (process.argv.length > 2) {
    let filename = process.argv[2]
    dump = JSON.parse(fs.readFileSync(filename))
    if (dump.buf) {
        dump.buf = Buffer.from(dump.buf, 'hex')
    }
}

if (dump.addresses?.power && dump.bufStartAddress) {
    const timestampAddress = dump.addresses.timestamp[0] - dump.bufStartAddress
    const powerAddress = dump.addresses.power[0] - dump.bufStartAddress
    let power = dump.buf.readUInt32LE(powerAddress)
    const startPower = power
    let powerDirection = 1

    setInterval(() => {
        power += powerDirection * 3
        if (power > startPower + 100) {
            powerDirection = -1
        } else if (power < startPower - 100) {
            powerDirection = 1
        }
        if (power < 0) {
            power = 0
            powerDirection = 1
        }
        dump.buf.writeUInt32LE(power, powerAddress)
        console.log('power:', power)
        dump.buf.writeUInt32LE(Date.now(), timestampAddress)
    }, 500)
}


// Keep the script running
process.on('SIGINT', () => {
    console.log('Stopping application...');
    process.exit();
});