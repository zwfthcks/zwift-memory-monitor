const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
    // zwiftapp: 'zwiftapp.exe'
        log: console.log
    }
)

zmm.on('data', (playerState) => {
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

