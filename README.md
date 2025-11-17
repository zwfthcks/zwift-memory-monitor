# zwift-memory-monitor

Works with Zwift version 1.84+

Last tested with: Zwift version 1.97.0

Windows only [^1].


## How to Use

````
npm install https://github.com/zwfthcks/zwift-memory-monitor
`````

### ESM / CommonJS

This package supports both CommonJS and ESM consumers. Use whichever import style your project requires:

- CommonJS (Node `require`):

```
const ZwiftMemoryMonitor = require('@zwfthcks/zwift-memory-monitor');
const zmm = new ZwiftMemoryMonitor();
```

- ESM (Node `import`):

```js
import ZwiftMemoryMonitor from '@zwfthcks/zwift-memory-monitor';
const zmm = new ZwiftMemoryMonitor();
```

Under the hood the package provides conditional `exports` in `package.json` so both module systems resolve the correct entrypoint.

v3 contains breaking changes. v2 can be installed from https://github.com/zwfthcks/zwift-memory-monitor#v2-branch


In your code:

`````
const ZwiftMemoryMonitor = require('@zwfthcks/zwift-memory-monitor');
const zmm = new ZwiftMemoryMonitor();
`````

ZwiftMemoryMonitor is an EventEmitter.

You have to listen for the 'ready' event and subsequently call a ``load*`` method followed by ```start```.

```
const ZwiftMemoryMonitor = require('../index.js');

const zmm = new ZwiftMemoryMonitor(
    {
        log: console.log,
        retry: true,
    }
)

zmm.on('data', (playerdata) => {
    console.log('>> ', playerdata.packetInfo.type, playerdata);
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

zmm.on('status.scanner.started', (type) => {
    console.log('>>','status.scanner.started', type)
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

```


See the full example in src/examples/state.js


## Pattern / signature files

To avoid having to update the dependency just because the pattern/signature changes, fetch the pattern at run-time with the ```loadURL```method:

For playerstate from

```
https://cdn.jsdelivr.net/gh/zwfthcks/zwift-memory-monitor@main/build/data/pattern-playerstate.json
```


For playerprofile from

```
https://cdn.jsdelivr.net/gh/zwfthcks/zwift-memory-monitor@main/build/data/pattern-playerprofile.json
```

Example:

```
zmm.once('ready', () => {
    try {
        zmm.loadURL('https://cdn.jsdelivr.net/gh/zwfthcks/zwift-memory-monitor@main/build/data/pattern-playerstate.json')
        zmm.loadURL('https://cdn.jsdelivr.net/gh/zwfthcks/zwift-memory-monitor@main/build/data/pattern-playerprofile.json')
    } catch (e) {
        console.log('>>', 'error in zmm.loadURL: ', e, zmm.lasterror)
    }

    try {
        zmm.start(['playerstate', 'playerprofile'])
        console.log('>>', 'last error:', zmm.lasterror)
    } catch (e) {
        console.log('>>', 'error in zmm.start(): ', e, zmm.lasterror)
    }
})
```

### v2 playerstate file

The old v2 format json is only available in the v2-branch version:

```
https://cdn.jsdelivr.net/gh/zwfthcks/zwift-memory-monitor@v2-branch/build/data/lookup-playerstateHeuristic.json
```




## Miscellaneous

### Calculated fields

See ZwiftMemoryScanner.js for details.

### playerstate


- ```cadence``` (rpm) is calculated from ````cadence_uHz```` (uHz)
- ````calories```` (kCal) is calculated from ````work```` (mWh)
- ```roadtime``` is corrected to match roadtime values in route definitions
- ``powerMeter``true/false showing if a power meter is present
- ``companionApp`` true/false
- ``forward``  true/false
- ``uTurn``  true/false
- ``rideons`` number of ride ons received
- ``roadId`` 
- ``isPortalRoad``  true/false
- ``gradientScalePct`` 

```
units = {
    distance: 'm',
    elevation: 'm',
    speed: 'mm/h',
    power: 'W',
    heartrate: 'bpm',
    cadence: 'rpm',
    calories: 'kcal',
}
```

### playerinfo

TBD :) 


## Supported

- Node >=20


## Notes

If zwiftapp.exe is elevated (as it typically will be right after an update) your process must also be elevated for openProcess to succeed.

  
  



[^1]: The same pattern scanning technique actually works for macOS, with exactly the same memory patterns as for Windows. It would just require a macOS specific memory scanning library to access Zwift memory from node.js.
