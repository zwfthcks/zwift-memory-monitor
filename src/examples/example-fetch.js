const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        log: console.log
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

zmm.on('status.loaded', () => {
    console.log('status.loaded')
    try {
        zmm.start()
    
        console.log('last error:', zmm.lasterror)
    
    } catch (e) {
        console.log('error in zmm.start(): ', zmm.lasterror)
    }
})


zmm.loadURL('https://zwfthcks.github.io/data/lookup-playerstate.json')