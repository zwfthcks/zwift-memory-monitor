const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        // log: console.log,
        // retry: false,
        retry: true,
        // zwift: {
        //     exe: 'testapp.exe',
        //     // exe: 'testapp-does-not-exist.exe',
        //     playerId: 0, // will cause an error if <player> pattern is used
        // },
        debug: true,
        
    }
)

const dataSeen = new Map();

zmm.on('data', (playerdata) => {
    if (!dataSeen.has(playerdata.packetInfo.type)) {
        dataSeen.set(playerdata.packetInfo.type, playerdata);
        console.log('>> ', playerdata.packetInfo.type, playerdata);
    }
})

zmm.on('status.started', (type) => {
    console.log('>>','status.started', type)

    // stop after 30 seconds 
    // setTimeout(() => {
    //     zmm.stop()    
    // }, 30000);

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
        zmm.loadPatterns(['playerstate'])
        // zmm.loadPatterns(['testappMiss'])
        // zmm.loadPatterns(['testappFailNoPlayer'])
    } catch (e) {
        console.log('>>', 'error in zmm.loadPatterns(): ', e, zmm.lasterror)
    }
})

zmm.on('loaded', () => {
    try {
        zmm.start(['playerstate'], {forceScan: false})
        // zmm.start(['testapp'], {forceScan: false})
        console.log('>>', 'last error:', zmm.lasterror)
    } catch (e) {
        console.log('>>', 'error in zmm.start(): ', e, zmm.lasterror)
    }
})


const memoryjs = require('memoryjs')

zmm.on('debug', (msg) => {
    console.log('>>', 'debug', msg)
    if (msg.baseaddress && msg.process) {
        const SIZE = 50_000
        let buf = memoryjs.readBuffer(msg.process.handle, msg.baseaddress - SIZE/2, SIZE)
        console.log('>>', 'debug', 'readBuffer', buf)

        // // if a filename is provided as argument, write the buffer to a file
        // if (process.argv.length > 2) {
        //     const fs = require('fs')
        //     fs.writeFileSync(process.argv[2], buf)
        // }

        let dump = {
            ...msg,
            buf: buf.toString('hex'),
           bufStartAddress: msg.baseaddress - SIZE/2,
        }

        // if a filename is provided as argument, write the buffer to a file
        if (process.argv.length > 2) {
            const fs = require('fs')
            fs.writeFileSync(process.argv[2], JSON.stringify(dump))
        }

        zmm.stop()
    }
})

