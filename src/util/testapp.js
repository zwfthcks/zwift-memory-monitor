// testapp.js

// Build to a executable with yao-pkg:
// npx yao-pkg testapp.js
// Build to a executable with bun:
// bun build --compile testapp.js



// This script will write a counter to a buffer every 2 seconds
// and output the buffer as a hex string


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