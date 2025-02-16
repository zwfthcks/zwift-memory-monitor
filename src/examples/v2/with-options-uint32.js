const ZwiftMemoryMonitor = require('../../index.js');

const ansiEscapes = require('ansi-escapes');

var offsets = {}

// generating the offsets to be read from memory
for (let i = 0x00; i < 0x130; i = i + 4) {
    offsets[ `uint32x${('000' + i.toString(16)).slice(-3)}`] = [ i , 'uint32']
}

// console.log(offsets)

const zmm = new ZwiftMemoryMonitor(
    {
        offsets: offsets,
        timeout: 500,
    }
)


    zmm.on('data', (data) => {
        console.log( ansiEscapes.clearTerminal + ansiEscapes.cursorTo(0,0))
        console.log(data)
    })

zmm.on('status.started', () => {
    console.log('status.started')

    // stop after 200 seconds 
    setTimeout(() => {
        zmm.stop()    
    }, 200000);

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
