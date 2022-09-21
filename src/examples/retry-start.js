const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        retry: true,
        keepalive: true,
        log: console.log,
    }
)

zmm.on('status.started', (...args) => {
    console.log('status.started', args)

    zmm.on('playerState', (playerState) => {
        console.log(playerState)
    })

    // stop after 200 seconds 
    setTimeout(() => {
        zmm.stop()    
    }, 200000);

})

zmm.on('status.stopped', (...args) => {
    console.log('status.stopped', args)
})

zmm.on('status.stopping', (...args) => {
    console.log('status.stopping', args)
})

zmm.on('status.retrying', (...args) => {
    console.log('status.retrying', args)
    // console.log('last error:', zmm.lasterror)
})

try {
    zmm.start()

    // console.log('last error:', zmm.lasterror)

} catch (e) {
    console.log('error in zmm.start(): ', zmm.lasterror)
}
