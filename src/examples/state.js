const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        log: console.log,
        retry: true,
    }
)

const dataSeen = new Map();

zmm.on('data', (playerdata) => {
    // if (!dataSeen.has(playerdata.packetInfo.type)) {
        dataSeen.set(playerdata.packetInfo.type, playerdata);
        console.log('>> ', playerdata.packetInfo.type, playerdata);
    // }
})

zmm.on('status.started', (type) => {
    console.log('>>','status.started', type)

    // stop after 30 seconds 
    setTimeout(() => {
        zmm.stop()    
    }, 30000);

})

zmm.on('status.retrying', (msg) => {
    console.log('>>','status.retrying', msg)
})

zmm.on('status.stopped', (type) => {
    console.log('>>','status.stopped', type)
})

zmm.on('status.scanner.stopped', (type) => {
    console.log('>>','status.scanner.stopped', type)
})

zmm.on('status.scanner.error', (type, error) => {
    console.log('>>','status.scanner.error', type, error)
})

zmm.on('status.stopping', () => {
    console.log('>>','status.stopping')
})

zmm.on('status.scanning', () => {
    console.log('>>','status.scanning')
})

zmm.once('ready', () => {
    try {
        zmm.loadPatterns(['playerstate', 'playerprofile'])
    } catch (e) {
        console.log('>>', 'error in zmm.loadPatterns(): ', e, zmm.lasterror)
    }

    try {
        zmm.start(['playerstate', 'playerprofile'])
        console.log('>>', 'last error:', zmm.lasterror)
    } catch (e) {
        console.log('>>', 'error in zmm.start(): ', e, zmm.lasterror)
    }
})

