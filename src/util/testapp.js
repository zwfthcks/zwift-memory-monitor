// testapp.js

// Build to an executable with yao-pkg:
// npx yao-pkg testapp.js
// Build to an executable with bun:
// bun build --compile testapp.js

// testapp.exe can be used for testing the ZwiftMemoryMonitor (e.g. src/examples/testappstate.js)
// easier and with less system impact than using Zwift itself


// This script will write a counter to a buffer every 2 seconds
// and output the buffer as a hex string

// Example pattern for testapp.exe in lookup.js:
// testappHit: [
//     {
//         type: 'testapp',
//         versions: "*",
//         offsets: {
//             test: [8, 'uint32'],
//             zero: [12, 'uint32'],
//         },
//         signatures: [
//             {
//                 pattern: '54 45 53 54 41 50 50 21',
//                 rules: {},
//                 addressOffset: 0
//             }
//         ],
//     }
// ],


// Import the buffer module
const Buffer = require('buffer').Buffer;

// Create a buffer to write to


const buffer = Buffer.alloc(20); // Create a 20-byte buffer

// Write TESTAPP! to first 8 bytes
buffer.write('TE', 0, 2);
buffer.write('ST', 2, 2);
buffer.write('AP', 4, 2);
buffer.write('P!', 6, 2);

let counter = 0;

// Set interval to run every 2 seconds
setInterval(() => {
    // Write counter as unsigned 32-bit integer to bytes 9-12
    buffer.writeUInt32LE(counter, 8);
    
    // Debug output to see the changes
    console.log('Counter:', counter);
    console.log('Buffer:', buffer.toString('hex'));

    
    counter++;
}, 2000);

// Keep the script running
process.on('SIGINT', () => {
    console.log('Stopping application...');
    process.exit();
});