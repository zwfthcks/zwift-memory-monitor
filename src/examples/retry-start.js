const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        retry: true,
        keepalive: true,
        log: console.log,
    }
)


zmm.on('data', (playerState) => {
    console.log(playerState)
})


zmm.on('status.started', (...args) => {
    console.log('status.started', args)

    // Provoking an error 30 seconds (only for demo purposes)
    setTimeout(() => {
        console.log('Provoking an error....')
        zmm._playerid = 1234    
    }, 30_000);

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

zmm.once('ready', () => {
    try {
        zmm.start()
    
        // console.log('last error:', zmm.lasterror)
    
    } catch (e) {
        console.log('error in zmm.start(): ', zmm.lasterror)
    }
})
