# zwift-memory-monitor

Works with Zwift version 1.29.1+

Last tested with: Zwift version 1.33.6

Windows only [^1].


## How to Use

````
npm install https://github.com/zwfthcks/zwift-memory-monitor
`````

In your code:

`````
const ZwiftMemoryMonitor = require('@zwfthcks/zwift-memory-monitor');
const zmm = new ZwiftMemoryMonitor();
`````

ZwiftMemoryMonitor is an EventEmitter.

You have to listen for the 'ready' event and subsequently call the ```start``` method.

See also src/examples/example.js



## Miscellaneous

### Calculated fields

- ```cadence``` (rpm) is calculated from ````cadence_uHz```` (uHz)
- ````calories```` (kCal) is calculated from ````work```` (mWh)



## Supported

- Node >=14.18.0 (but only tested w/Node >=16)


## Notes

If zwiftapp.exe is elevated (as it typically will be right after an update) your process must also be elevated for openProcess to succeed.



[^1]: The same pattern scanning technique actually works for macOS, with exactly the same memory patterns as for Windows. It would just require a macOS specific memory scanning library to access Zwift memory from node.js.
