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

    // stop after 30 seconds 
    setTimeout(() => {
        zmm.stop()    
    }, 10000);

})

zmm.on('status.stopped', (type) => {
    console.log('status.stopped', type)
})

zmm.on('status.stopping', () => {
    console.log('status.stopping')
})

zmm.once('ready', () => {
    try {
        zmm.loadPatterns(['playerprofile', 'playerstate'])
    } catch (e) {
        console.log('error in zmm.loadPatterns(): ', e, zmm.lasterror)
    }

    try {
        zmm.start()
        console.log('last error:', zmm.lasterror)
    } catch (e) {
        console.log('error in zmm.start(): ', e, zmm.lasterror)
    }
})

