const EventEmitter = require('events')
const memoryjs = require('memoryjs');
const semver = require('semver')

const fs = require('fs');
const path = require('path')
const os = require('os')

/**
 * 
 */
class ZwiftMemoryMonitor extends EventEmitter {
  constructor (options = { }) {
    super()

    // bind this for functions
    this._checkBaseAddress = this._checkBaseAddress.bind(this)
    this._getCachedScan = this._getCachedScan.bind(this)
    this._saveCachedScan = this._saveCachedScan.bind(this)
    this.readPlayerState = this.readPlayerState.bind(this)

    // initialise _options object with defaults and user set options
    this._options = {
      // zwiftlog: path to log.txt for Zwift
      zwiftlog: path.resolve(os.homedir(), 'documents', 'Zwift', 'Logs', 'Log.txt'),
      // zwiftapp: the process name to look for
      zwiftapp: 'ZwiftApp.exe',
      // lookup: lookup table with version specific configuration
      lookup: [
        {
          // version: version numbers matching the pattern and positions
          versions: "*",
          // offsets: field configuration
          offsets: {
            // Relative position to player (the baseaddress)
            // Here calculated as the field specific offset used in MOV minus 0x20 (offset for player in MOV)
            climbing: [0x60 - 0x20, memoryjs.UINT32],
            speed: [0x3c - 0x20, memoryjs.UINT32],
            distance: [0x30 - 0x20, memoryjs.UINT32],
            time: [0x64 - 0x20, memoryjs.UINT32],
            cadence_uHz: [0x48 - 0x20, memoryjs.UINT32], // unit uHz
            heartrate: [0x50 - 0x20, memoryjs.UINT32],
            power: [0x54 - 0x20, memoryjs.UINT32],
            player: [0x20 - 0x20, memoryjs.UINT32],
            x: [0x88 - 0x20, memoryjs.FLOAT], // To be verified
            y: [0xa0 - 0x20, memoryjs.FLOAT], // To be verified
            altitude: [0x8c - 0x20, memoryjs.FLOAT], // To be verified
            watching: [0x90 - 0x20, memoryjs.UINT32],
            world: [0x110 - 0x20, memoryjs.UINT32],
            work: [ 0x84 - 0x20, memoryjs.UINT32 ],  // unit mWh
          },
          // signature: pattern to search for
          signature: {
            start: '1E 00 00 00 00 00 00 00 00 00 00 00',
            end: '00 00 00 00',
            addressOffset: 12
          },
        }
      ],
      // timeout: interval between reading memory
      timeout: 100,
      // retry: keep retrying start() until success
      retry: false, 
      // keepalive: try to start() again after process disappears
      keepalive: false,
      // override with called options:
      ...options
    }
    
    // other supported options:
    // log: function for logging, e.g. console.log
    // playerid: use this playerid and do not attempt to detect it from log.txt

    // log can be set to e.g. console.log in options
    this.log = this._options?.log || (() => { }) 

    // initial values
    this._started = false
    
    
  }
  
  /**
   * 
   */
  start(forceScan = false) {
    
    this._started = false

    this._retry = this._options?.retry || false

    // Find the Zwift process
    try {
      this._processObject = memoryjs.openProcess(this._options.zwiftapp);
    } catch (e) {
      this.lasterror = 'Error in openProcess'
      // throw new Error('Error in openProcess', `${this._options.zwiftapp}` )
    }
    
    if (this?._processObject) {

      this._addresses = {}
      
      this._zwiftversion = this._getGameVersion() || '0.0.0'
      
      // if signature or offsets are overridden in object initialisation they will be used
      // but otherwise _options.lookup will be searched for first entry matching the game version
      if (!this._options?.signature || !this._options?.offsets) {
        let lookup = this?._options.lookup.find((entry) => {
          return semver.satisfies(this._zwiftversion, entry.versions)
        })

        if (lookup && !this._options.signature) {
          this._options.signature = lookup.signature
        }
        if (lookup && !this._options.offsets) {
          this._options.offsets = lookup.offsets
        }
      }

      if (this._options?.signature) {
        this._playerid = this._options?.playerid || this._getPlayerid() || 0
      } else {
        this.lasterror = 'Missing signature for current game version'
      }
  
      if (this._options?.signature && this?._playerid > 0) {
        
        let pattern = `${this._options?.signature?.start} ${('00000000' + this._playerid.toString(16)).substr(-8).match(/../g).reverse().join(' ')} ${this._options?.signature?.end}`
        // let pattern = `${lookup.signature?.start} ${('00000000' + this._playerid.toString(16)).substr(-8).match(/../g).reverse().join(' ')} ${lookup.signature?.end}`
        this.log(pattern);
        let addressOffset = this._options.signature?.addressOffset || 0;
        // let addressOffset = lookup.signature?.addressOffset || 0;
        
        let cachedScan = undefined;

        if (!forceScan) {
          cachedScan = this._getCachedScan()
        }

        if (forceScan || !cachedScan?.baseaddress) {
          memoryjs.findPattern(this._processObject.handle, pattern, memoryjs.NORMAL, addressOffset, this._checkBaseAddress);
        } else {
          this._checkBaseAddress(null, cachedScan.baseaddress)
        }

        
      } else {
        this.lasterror = 'Player ID not found'
      }
      
    }
    
    // If configured in options the wait 10 seconds and try again
    if (this._retry && !this._started) {
      this.emit('status.retrying', this.lasterror)
      this._retryTimeout = setTimeout(() => {
        this.start()
      }, 10_000);
    }
    
  }
  

  /**
   * 
   */
  _checkBaseAddress(error, address) {
    this.log(error, address)
    if (error && !address) {
      this.lasterror = error
    }

    this._baseaddress = address  
    this.log(`base address: 0x${this._baseaddress.toString(16)}`);
    
    if (this?._baseaddress) {
      // verify by reading back from memory
      const value = memoryjs.readMemory(this._processObject.handle, this._baseaddress, memoryjs.UINT32)
      this.log(`value: ${value} = 0x${value.toString(16)}`);
      
      if (value != this._playerid) {
        this._baseaddress = 0
        this.lasterror = 'Could not verify player ID in memory'
        this._deleteCachedScan()
      } else {
        this._saveCachedScan({
          processObject: this._processObject,
          baseaddress: this._baseaddress
        })
      }
    }
    
    if (this?._baseaddress) {
      Object.keys(this._options.offsets).forEach((key) => {
        // this._addresses[key] = [ this._baseaddress - this._options.offsets?.player[0] + this._options.offsets[key][0],  this._options.offsets[key][1] ]
        this._addresses[key] = [ this._baseaddress + this._options.offsets[key][0],  this._options.offsets[key][1] ]
      })
      
      this.log(this._addresses)
      
      this._interval = setInterval(this.readPlayerState, this._options.timeout)
      this._started = true

      this.emit('status.started')
      
    } 
    
  }


  /**
   * 
   */
  stop() {
    
    this._started = false

    clearInterval(this._interval)
    
    if (this?._retryTimeout) {
      clearTimeout(this._retryTimeout)
    }
    
    try {
      memoryjs.closeProcess(this?.processObject?.handle)
    } catch (e) {
      // 
    }

    delete this._processObject

    this.emit('status.stopped')

    if (this._options?.keepalive) {
      this.emit('status.retrying', this.lasterror)
      this.start()
    }
    
  }
  
  /**
   * 
   */
  readPlayerState () {
    
    var playerState = {}

    if (this._started) {
      try {
        Object.keys(this._options.offsets).forEach((key) => {
          playerState[key] = memoryjs.readMemory(this?._processObject?.handle, this._addresses[key][0], this._addresses[key][1])
        })

        if (playerState?.cadence_uHz) {
          playerState.cadence = Math.round(playerState?.cadence_uHz / 1000000 * 60)
        }

        if (playerState?.work) {
          playerState.calories = Math.round(playerState?.work  * 3600 / 1000 / 4.184 / 0.25 / 1000)
        }

        // verify by reading player id back from memory
        if (this._playerid != memoryjs.readMemory(this._processObject.handle, this._baseaddress, memoryjs.UINT32)) {
          // Probably because Zwift was closed...
          this.lasterror = 'Could not verify player ID in memory'
          throw new Error(this.lasterror)
        }

        this.emit('playerState', playerState)

      } catch (e) {
        // 
        this.emit('status.stopping', this.lasterror)
        this.stop()
      }

    }
  }


  _getPlayerid() {
    // Determine player ID from log.txt
    this.log('Zwift log file:', this._options.zwiftlog)
    if (fs.existsSync(this._options.zwiftlog)) {
      let logtxt = fs.readFileSync(this._options.zwiftlog, 'utf8');
      
      // [12:02:30] NETCLIENT:[INFO] Player ID: 793163
      let patterns = {
        user :    /\[(?:[^\]]*)\]\s+NETCLIENT:\[INFO\] Player ID: (\d*)/g ,
      }
      
      let match;
      
      while ((match = patterns.user.exec(logtxt)) !== null) {
        let playerid = parseInt(match[1]);
        this.log(`Zwift seems to run with player ID: ${playerid} = ${('00000000' + playerid.toString(16)).substr(-8)}`)
        return playerid
      }
    } 
  }


  _getGameVersion() {
    // Determine game version from log.txt
    this.log('Zwift log file:', this._options.zwiftlog)
    if (fs.existsSync(this._options.zwiftlog)) {
      let logtxt = fs.readFileSync(this._options.zwiftlog, 'utf8');

      // [15:56:28] Game Version: 1.26.1(101164) dda86fe0235debd7146c0d8ceb1b0d5d626ddf77
      let patterns = {
        version :    /\[(?:[^\]]*)\]\s+Game Version: ((?:\d+)\.(?:\d+)\.(?:\d+))/g ,
      }
      
      let match;
      
      while ((match = patterns.version.exec(logtxt)) !== null) {
        this.log(`Zwift seems to be version: ${match[1]}`)
        return match[1];
      }
    } 
  }



  _getCachedScan() {
    let cachedScan = undefined

    if (fs.existsSync(path.join(os.tmpdir(), 'zwift-memory-monitor_cache'))) {
      try {
        cachedScan = JSON.parse(fs.readFileSync(path.join(os.tmpdir(), 'zwift-memory-monitor_cache'), 'utf8') || '{}')
      } catch (e) {
        cachedScan = null
        this._deleteCachedScan()
      }

      if ((this._processObject.th32ProcessID !== cachedScan?.processObject?.th32ProcessID) ||
        (this._processObject.th32ParentProcessID !== cachedScan?.processObject?.th32ParentProcessID) ||
        (this._processObject.szExeFile !== cachedScan?.processObject?.szExeFile)) {
        // Cached scan is not for the current process object so ignore and delete it
        cachedScan = null
        this._deleteCachedScan()
      }
    }

    return cachedScan
  }

  _deleteCachedScan() {
    try {
      fs.rmSync(path.join(os.tmpdir(), 'zwift-memory-monitor_cache'))
    } catch (e) {}
  }

  _saveCachedScan(cachedScan) {
    try {
      fs.writeFileSync(path.join(os.tmpdir(), 'zwift-memory-monitor_cache'), JSON.stringify(cachedScan))
    } catch (e) {
      this._deleteCachedScan()
    }
  }
  
}


module.exports = ZwiftMemoryMonitor

