const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    // {
    // zwiftapp: 'zwiftapp.exe'
    // }
)

console.log('last error:', zmm.lasterror)


zmm.on('status.started', () => {
    console.log('status.started')

    zmm.on('playerState', (playerState) => {
        console.log(playerState)
    })

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
