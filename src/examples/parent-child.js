if (process.argv[2] === 'child') {
    asChild()
} else {
    asParent()
}




function asChild() {
    
    const process = require('node:process')
    const ZwiftMemoryMonitor = require('../index.js');
    
    const zmm = new ZwiftMemoryMonitor(
        // {
        //     zwiftapp: 'zwiftapp.exe',
        //     playerid: 77777,
        // }
    )
    
    // console.log('last error:', zmm.lasterror)
    process.send({ type: 'lasterror', payload: 'last error: ' + zmm.lasterror })
    
    
    zmm.on('status.started', () => {
        // console.log('status.started')
        process.send({ type: 'status', payload: 'status.started' })
        
        zmm.on('playerState', (playerState) => {
            // console.log(playerState)
            process.send({ type: 'playerstate', payload: playerState })

        })
        
        // stop after 20 seconds 
        setTimeout(() => {
            zmm.stop()    
        }, 20000);
        
    })
    
    zmm.on('status.stopped', () => {
        // console.log('status.stopped')
        process.send({ type: 'status', payload: 'status.stopped' })
    })
    
    zmm.on('status.stopping', () => {
        // console.log('status.stopping')
        process.send({ type: 'status', payload: 'status.stopping' })
    })

    try {
        zmm.start()
        
        // console.log('last error:', zmm.lasterror)
        process.send({ type: 'lasterror', payload: 'last error: ' + zmm.lasterror })
        
    } catch (e) {
        // console.log('error in zmm.start(): ', zmm.lasterror)
        // process.send('error in zmm.start(): ' + zmm.lasterror)
        process.send({ type: 'lasterror', payload: 'last error: ' + zmm.lasterror })
    }
    
        
}    


function asParent() {
    
    // Just to show that parent isn't blocked
    setInterval(() => {
        console.log('tick')    
    }, 1000);
    
    // fork of child process
    const { fork } = require('node:child_process');
    const controller = new AbortController();
    const { signal } = controller;
    const child = fork(__filename, ['child'], { signal });
    
    child.on('error', (err) => {
        // This will be called with err being an AbortError if the controller aborts
    });
    
    child.on('message', (msg) => {
        console.log('Got message:',msg)
    })
    
    // controller.abort(); // Stops the child process
    
}


