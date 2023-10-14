// This demonstrates how offsets can be provided as options
// The output here is also useful when verifying if the offsets from lookup.js are correct

const ZwiftMemoryMonitor = require('../index.js');

const ansiEscapes = require('ansi-escapes');

const lookupPatterns = require('../lookup.js')


var offsets = { ...lookupPatterns['playerstate'].shift().offsets }

// generating the offsets to be read from memory
for (let i = 0x00; i < 0x130; i = i + 4) {
    offsets[ `_offset_0x${('000' + i.toString(16)).slice(-3)}`] = [ i , 'uint32']
}

const zmm = new ZwiftMemoryMonitor(
    {
        offsets: offsets,
        timeout: 500,
    }
)


    zmm.on('data', (data) => {
        console.log( ansiEscapes.clearTerminal + ansiEscapes.cursorTo(0,0))
        console.log(Object.entries(data).sort())
    })

zmm.on('status.started', () => {
    console.log('status.started')

    // stop after 20 seconds 
    setTimeout(() => {
        zmm.stop()    
    }, 20_000);

})

zmm.on('status.stopped', () => {
    console.log('status.stopped')
})

zmm.on('status.stopping', () => {
    console.log('status.stopping')
})

zmm.once('ready', () => {
    try {
        zmm.start()
    
        console.log('last error:', zmm.lasterror)
    
    } catch (e) {
        console.log('error in zmm.start(): ', zmm.lasterror)
    }
})
