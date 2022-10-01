/**
 * @module @zwfthcks/ZwiftMemoryMonitor
 * 
 */



const EventEmitter = require('events')
const memoryjs = require('memoryjs');
const semver = require('semver')

// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const fetch = require('node-fetch')

const fs = require('fs');
const path = require('path')
const os = require('os')

const lookupPatterns = require('./lookup.js')


/**
 * ZwiftMemoryMonitor
 * 
 *
 * @class ZwiftMemoryMonitor
 * @extends {EventEmitter}
 */
class ZwiftMemoryMonitor extends EventEmitter {
  
  
  /**
   * Creates an instance of ZwiftMemoryMonitor.
   * @param {*} [options={}]
   * @memberof ZwiftMemoryMonitor
   */
  constructor(options = {}) {
    super()

    // bind this for functions
    this._checkBaseAddress = this._checkBaseAddress.bind(this)
    this._getCachedScan = this._getCachedScan.bind(this)
    this._writeCachedScanFile = this._writeCachedScanFile.bind(this)
    this._readCachedScanFile = this._readCachedScanFile.bind(this)
    this.readPlayerData = this.readPlayerData.bind(this)

    // initialise _options object with defaults and user set options
    this._options = {
      // zwiftlog: path to log.txt for Zwift
      zwiftlog: path.resolve(os.homedir(), 'documents', 'Zwift', 'Logs', 'Log.txt'),
      // zwiftapp: the process name to look for
      zwiftapp: 'ZwiftApp.exe',
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
    // type: the (master) lookup pattern to use
    // lookup: array with lookup pattern objects (see lookup.js for format)
    // offsets: specific 'offsets' definition to use when searching
    // signature: specific 'signature' definition to use when searching
    

    // lookup: lookup table with version specific configuration
    if (!this._options.lookup && this._options.type) {
      this._options.lookup = lookupPatterns[this._options.type] || null
    } 

    if (!this._options.lookup && (!this._options.offsets || !this.options.signature)) {
      this._options.lookup = Object.values(lookupPatterns)?.shift()
      this._options.type = Object.keys(lookupPatterns)?.shift()
    } 


    // log can be set to e.g. console.log in options
    this.log = this._options?.log || (() => { }) 

    // initial values
    this._started = false
    
  }

  /**
   * @param {*} type 
   */
  loadType(type) {
    if (!type) {
      if (this._options.type) {
        type = this._options.type
      } else {
        type = Object.keys(lookupPatterns)?.shift()
      }
    }

    try {
      this._options.lookup = lookupPatterns[type]
      this.log('loaded pattern', type)
      this.emit('status.loaded')
    } catch (error) {
      this.lasterror = 'error in loadPattern'
      this.log(this.lasterror, error)
      this.emit('status.error')
    }
  }

  /**
   * DEPRECATED - use loadURL instead
   * @param {*} fetchLookupURL 
   */
  load(fetchLookupURL) {
    this.loadURL(fetchLookupURL)
  }


  /**
   * 
   *
   * @param {*} fetchLookupURL
   * @memberof ZwiftMemoryMonitor
   */
  loadURL(fetchLookupURL) {
    // 
    if (!fetchLookupURL) {
      this.log('no fetchURL')
      this.emit('status.loaded')
      
    } else {
      fetch(fetchLookupURL)
      .then((response) => {
        return response.json();
      })
      .catch()
      .then((data) => {
        this.log(JSON.stringify(data, '', 2))
        this._options.lookup = data
        this.emit('status.loaded')
      })
        .catch()
    }
  }
  

  /**
   *
   *
   * @param {boolean} [forceScan=false]
   * @memberof ZwiftMemoryMonitor
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
        let lookupFound = this?._options.lookup.find((entry) => {
          return semver.satisfies(this._zwiftversion, entry.versions)
        })

        if (lookupFound && !this._options.signature) {
          this._options.signature = lookupFound.signature
        }
        if (lookupFound && !this._options.offsets) {
          this._options.offsets = lookupFound.offsets
        }
      }

      if (this._options?.signature) {
        this._playerid = this._options?.playerid || this._getPlayerid() || 0
      } else {
        this.lasterror = 'Missing signature for current game version'
      }
  
      if (this._options?.signature && this?._playerid > 0) {
        
        let pattern = `${this._options?.signature?.start} ${('00000000' + this._playerid.toString(16)).slice(-8).match(/../g).reverse().join(' ')} ${this._options?.signature?.end}`
        this.log(pattern);
        let addressOffset = this._options.signature?.addressOffset || 0;
        
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
   * @param {*} error 
   * @param {*} address 
   */
  /**
   * Internal method. Used as callback to findPattern in .start
   * Verifies the found address by reading player ID from memory.
   * Emits status.started on success
   * @param {*} error
   * @param {*} address
   * @fires status.started
   * @memberof ZwiftMemoryMonitor
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
        this._deleteCachedScanFile()
      } else {
        this._writeCachedScanFile({
          processObject: this._processObject,
          baseaddress: this._baseaddress
        })
      }
    }
    
    if (this?._baseaddress) {
      Object.keys(this._options.offsets).forEach((key) => {
        this._addresses[key] = [ this._baseaddress + this._options.offsets[key][0],  this._options.offsets[key][1] ]
      })
      
      this.log(this._addresses)
      
      this._interval = setInterval(this.readPlayerData, this._options.timeout)
      this._started = true

      this.emit('status.started')
      
    } 
    
  }


  /**
   *
   *
   * @fires status.stopped
   * @fires status.retrying
   * @memberof ZwiftMemoryMonitor
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
   * @fires playerData
   * @fires status.stopping
   * @memberof ZwiftMemoryMonitor
   */
  readPlayerData () {
    
    var playerData = {}

    if (this._started) {
      try {
        Object.keys(this._options.offsets).forEach((key) => {
          playerData[key] = memoryjs.readMemory(this?._processObject?.handle, this._addresses[key][0], this._addresses[key][1])
        })

        if (playerData?.cadence_uHz >= 0) {
          playerData.cadence = Math.round(playerData?.cadence_uHz / 1000000 * 60)
        }

        if (playerData?.work >= 0) {
          playerData.calories = Math.round(playerData?.work  * 3600 / 1000 / 4.184 / 0.25 / 1000)
        }

        // verify by reading player id back from memory
        if (this._playerid != memoryjs.readMemory(this._processObject.handle, this._baseaddress, memoryjs.UINT32)) {
          // Probably because Zwift was closed...
          this.lasterror = 'Could not verify player ID in memory'
          throw new Error(this.lasterror)
        }

        this.emit('data', playerData)

      } catch (e) {
        // 
        this.emit('status.stopping', this.lasterror)
        this.stop()
      }

    }
  }


  /**
   *
   *
   * @return {*} 
   * @memberof ZwiftMemoryMonitor
   */
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
        this.emit('info', `playerid ${playerid}`)
        return playerid
      }
    } 
  }

 
  /**
   *
   *
   * @return {*} 
   * @memberof ZwiftMemoryMonitor
   */
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
        this.emit('info', `version ${match[1]}`)
        return match[1];
      }
    } 
  }



  /**
   * Get a cached scan object if it exists and matches the currently running Zwift process
   *
   * @return {*} 
   * @memberof ZwiftMemoryMonitor
   */
  _getCachedScan() {
    let cachedScan = undefined

    cachedScan = this._readCachedScanFile()

    if (cachedScan) {
      // compare with the current Zwift process object:
      if ((this._processObject.th32ProcessID !== cachedScan?.processObject?.th32ProcessID) ||
        (this._processObject.th32ParentProcessID !== cachedScan?.processObject?.th32ParentProcessID) ||
        (this._processObject.szExeFile !== cachedScan?.processObject?.szExeFile)) {
        // Cached scan is not for the current process object so ignore and delete it
        cachedScan = null
        this._deleteCachedScanFile()
      }
    }

    return cachedScan
  }

  /**
   * Delete cached scan file in temp folder
   *
   * @memberof ZwiftMemoryMonitor
   */
  _deleteCachedScanFile() {
    try {
      fs.rmSync(this._getCachedScanFileName())
    } catch (e) {}
  }


  /**
   * Write object to cached scan file in temp folder
   *
   * @param {*} cachedScan
   * @memberof ZwiftMemoryMonitor
   */
  _writeCachedScanFile(cachedScan) {
    try {
      fs.writeFileSync(this._getCachedScanFileName(), JSON.stringify(cachedScan))
    } catch (e) {
      // delete cache in case of any error during write
      this._deleteCachedScanFile()
    }
  }
  


  /**
   * Read cached scan file from temp folder and return the saved object if found.
   * In case of errors, the cache file will be deleted.
   *
   * @return 
   * @memberof ZwiftMemoryMonitor
   */
  _readCachedScanFile() {

    let cachedScan = undefined

    if (fs.existsSync(this._getCachedScanFileName())) {
      try {
        cachedScan = JSON.parse(fs.readFileSync(this._getCachedScanFileName(), 'utf8') || '{}')
      } catch (e) {
        cachedScan = null
        // this._deleteCachedScanFile()
        this._deleteCachedScanFile()
      }

    }
    
    return cachedScan
  }
  
  /**
   *
   * @return 
   * @memberof ZwiftMemoryMonitor
   */
  _getCachedScanFileName() {
    
    if (!this._cachedScanFileName) {
      // console.log('must find cache filename')
      const crypto = require('crypto');
      // console.log('required crypto')
      
      // Creating Hash
      const hash = crypto.createHash('sha256');
      // console.log('has defined hash')
      // Use the combination of lookup, offsets, and signature to obtain a hash value for the cache name
      hash.update(JSON.stringify([this?._options?.lookup, this?._options?.offsets,this?._options?.signature]));
      // console.log('has updated hash')
      const suffix = hash.digest().toString('hex')
      // console.log('got suffix',suffix)
      
      this._cachedScanFileName = path.join(os.tmpdir(), `zwift-memory-monitor_${suffix}`)
      this.log('Cache file:',this._cachedScanFileName)
    }

    return this._cachedScanFileName
  }
  
}


module.exports = ZwiftMemoryMonitor

