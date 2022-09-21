const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        // activating logging in this example
        log: console.log,

        // a version based lookup table
        lookup: [
            {
              versions: "1.29.*",
              offsets: {
                power: [0x54 - 0x20, 'uint32'],
              },
              signature: {
                start: '1E 00 00 00 00 00 00 00 00 00 00 00',
                end: '00 00 00 00',
                addressOffset: 12
              },
            },
            {
              versions: "*",
              offsets: {
                power: [0x50 - 0x20, 'uint32'],
              },
              signature: {
                start: '1E 00 00 00 00 00 00 00 00 00 00 00',
                end: '00 00 00 00',
                addressOffset: 12
              },
            },
            
          ],
    }
)

console.log('last error:', zmm.lasterror)

zmm.on('playerState', (playerState) => {
    console.log(playerState)
})

zmm.on('status.started', () => {
    console.log('status.started')

    // stop after 20 seconds 
    setTimeout(() => {
        zmm.stop()    
    }, 20000);

})

zmm.on('status.stopped', () => {
    console.log('status.stopped')
})

zmm.on('status.stopping', () => {
    console.log('status.stopping')
})

try {
    zmm.start()

    console.log('last error:', zmm.lasterror)

} catch (e) {
    console.log('error in zmm.start(): ', zmm.lasterror)
}
