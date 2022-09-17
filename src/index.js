const EventEmitter = require('events')
const memoryjs = require('memoryjs');

const fs = require('fs');
const path = require('path')
const os = require('os')


class ZwiftMemoryMonitor extends EventEmitter {
  constructor (options = { }) {
    super()

    this._options = {
      zwiftlog: path.resolve(os.homedir(), 'documents', 'Zwift', 'Logs', 'Log.txt'),
      zwiftapp: 'ZwiftApp.exe',
      offsets: {
        counter: 0x84,
        altitude: 0x8c,
        climbing: 0x60,
        speed: 0x3c,
        distance: 0x30,
        time: 0x64,
        cadenceUHz: 0x48,
        heartrate: 0x50,
        power: 0x54,
        player: 0x20,
        // x: 0x??,
        // y: 0x??,
        // calories: 0x??,
      },
      signature: {
        start: '1E 00 00 00 00 00 00 00 00 00 00 00',
        end: '00 00 00 00',
        addressOffset: 12
      },
      timeout: 100,
      ...options
    }
    
    this._started = false
    
    
  }
  
  start() {
    
    this._started = false
    
    // Find the Zwift process
    try {
      this._processObject = memoryjs.openProcess(this._options.zwiftapp);
    } catch (e) {
      this.lasterror = 'Error in openProcess'
      throw new Error('Error in openProcess', `${this._options.zwiftapp}` )
    }
    
    console.log('started')
    
    this._addresses = {}
    
    this._playerid = this._options?.playerid || 0
    
    if (!this._playerid) {

      // Determine player ID from log.txt
      console.log('Zwift log file:', this._options.zwiftlog)
      if (fs.existsSync(this._options.zwiftlog)) {
        let logtxt = fs.readFileSync(this._options.zwiftlog, 'utf8');
        
        // [12:02:30] NETCLIENT:[INFO] Player ID: 793163
        let patterns = {
          user :    /\[(?:[^\]]*)\]\s+NETCLIENT:\[INFO\] Player ID: (\d*)/g ,
        }
        
        let match;
        
        while ((match = patterns.user.exec(logtxt)) !== null) {
          this._playerid = parseInt(match[1]);
        }
        console.log(`Zwift seems to run with player ID: ${this._playerid} = ${('00000000' + this._playerid.toString(16)).substr(-8)}`)
        
      }
    }
    
    if (this?._playerid > 0) {
      
      let signature = `${this._options?.signature?.start} ${('00000000' + this._playerid.toString(16)).substr(-8).match(/../g).reverse().join(' ')} ${this._options?.signature?.end}`
      console.log(signature);
      let addressOffset = this._options.signature?.addressOffset || 0;
      
      memoryjs.findPattern(this._processObject.handle, signature, memoryjs.NORMAL, addressOffset, (error, address) => {
        console.log(error, address)
        if (error && !address) {
          this.lasterror = error
        }

        this._baseaddress = address  
        console.log(`base address: 0x${this._baseaddress.toString(16)}`);
        
        if (this?._baseaddress) {
          // verify by reading back from memory
          const value = memoryjs.readMemory(this._processObject.handle, this._baseaddress, memoryjs.UINT32)
          console.log(`value: ${value} = 0x${value.toString(16)}`);
          
          if (value != this._playerid) {
            this._baseaddress = 0
            this.lasterror = 'Could not verify player ID in memory'
          }
        }
        
        if (this?._baseaddress) {
          Object.keys(this._options.offsets).forEach((key) => {
            this._addresses[key] = this._baseaddress - this._options.offsets?.player + this._options.offsets[key]
          })
          
          console.log(this._addresses)
          
          this._interval = setInterval(this.readPlayerState.bind(this), this._options.timeout)
          this._started = true

          this.emit('status.started')
          
        } 
        
      });
      
    } else {
      this.lasterror = 'Player ID not found'
    }
    
    
  }
  
  stop() {
    
    this._started = false

    clearInterval(this._interval)
    
    try {
      memoryjs.closeProcess(this?.processObject?.handle)
    } catch (e) {
      // 
    }

    this.emit('status.stopped')
    
  }
  
  readPlayerState () {
    
    var playerState = {}

    if (this._started) {
      try {
        Object.keys(this._options.offsets).forEach((key) => {
          playerState[key] = memoryjs.readMemory(this?._processObject?.handle, this._addresses[key], memoryjs.UINT32)
        })

        playerState.cadence = Math.floor(playerState?.cadenceUHz / 1000000 * 60)

        this.emit('playerState', playerState)

      } catch (e) {
        // 
        this.emit('status.stopping')
        this.stop()
      }

    }


  }
  
}


module.exports = ZwiftMemoryMonitor

