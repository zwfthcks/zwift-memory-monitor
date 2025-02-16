/**
 * @module @zwfthcks/ZwiftMemoryMonitor
 * 
 */

const EventEmitter = require('node:events')
const memoryjs = require('memoryjs');
const semver = require('semver')
const crypto = require('crypto');

const patternDefinitions = require('./lookup.js')

const ZwiftData = require('./ZwiftData.js')
const ZwiftMemoryScanner = require('./ZwiftMemoryScanner.js')

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

    this._ready = false

    // initialise _options object with defaults and user set options
    this._options = {
      ...this._defaultOptions(),
      ...options
    }

    // default options:
    // timeout: 100,  // interval between reading memory
    // retry: false, // wait 10 seconds and try again if process not found at start
    // keepalive: false, // try to start() again after process disappears
    // log: console.log // function for logging, e.g. console.log

    // possible options besides the default options:

    // zwift: { ... } // options for ZwiftData
    // Override the values in zwift (some or all) to control where the monitor looks for Zwift data:
    // - exe
    // - appFolder
    // - zwiftVerCurFilenameTxtPath
    // - logTxtPath
    // - prefsXmlPath
    // Override values in zwift (some or all) to avoid reading from files:
    // - _version
    // - _flagId
    // - _playerId
    // - _sportId
    // - _worldId
  
    this._patterns = new Map();
  
    this.debug = this._options.debug ?? false
    // log can be set to e.g. console.log in options

    this.loglevel = this._options.loglevel ?? ((this._options.debug ?? false) ? 'DEBUG' : 'ERROR')
    
    this.log = this._options?.log || (() => { })
    
    if (this.loglevel === 'DEBUG') {
      this.logDebug = this.log
    } else {
      this.logDebug = () => { }
    }
    
    // initial values
    this._started = false

    this.scanners = new Map();


    this._savedStartParam = {}


    this.on('status.scanner.error', (type, error) => {
      this.log('status.scanner.error', type, error)
      this.stop(true)

      if (this._options.retry) {
        this.emit('status.retrying', 'Waits a bit and tries again')
        setTimeout(() => {
          this.start(this._savedStartParam.types ?? null, this._savedStartParam.startOptions ?? {})
        }, 10_000);
      }
    })

    let zwiftDataOptions = {
      log: this.log,
      logDebug: this.logDebug,
      ...(this._options.zwift ?? {})
    }

    this._zwift = new ZwiftData(this._options.zwift ?? null)
    this._zwift.init().then(() => {
      this._ready = true
      this.emit('ready')
    }).catch((error) => {
      this.log('error in ZwiftData.init()', error)
      this.emit('error', error)
    })

  }


  _defaultOptions() {
    return {
      timeout: 100,  // timeout: interval between reading memory
      retry: false,
      keepalive: false, // keepalive: try to start() again after process disappears
    }
  }




  /**
   * @param {*} type 
   */
  loadPatterns(patternIds) {

    if (!this._ready) throw new Error('not ready in loadPatterns');

    try {
      if (Array.isArray(patternIds)) {
        patternIds.forEach((patternIds) => {
          this._loadPattern(patternIds)
        })
      }

      this.logDebug('loaded patterns', patternIds)
      this.emit('status.loaded', patternIds)
      this.emit('loaded', this.loadedTypes)

    } catch (error) {
      throw new Error('error in loadPatterns', error)
    }

    return true;
  }


  /**
   * @param {*} type 
   */
  loadPattern(patternId) {

    if (!this._ready) throw new Error('not ready in loadPattern');
    if (!patternId) throw new Error('no patternId in loadPattern');


    try {
      if (this._loadPattern(patternId)) {
        this.logDebug('loaded pattern', patternId)
        this.emit('status.loaded', [patternId])
        this.emit('loaded', this.loadedTypes)
      } else {
        return false
      }
    } catch (error) {
      throw new Error('error in loadPattern', error)
    }

    return true;
  }


  _loadPattern(patternId) {
    if (!this._ready) throw new Error('not ready in _loadPattern');
    if (!patternId) throw new Error('no patternId in _loadPattern');

    try {
      // set type to the value of the type property in the first object in the array, otherwise use the patternId
      const type = patternDefinitions[patternId][0]?.type ?? patternId
      this._patterns.set(type, patternDefinitions[patternId])
      this.logDebug('loaded pattern', patternId, 'as', type)
    } catch (error) {
      throw new Error('error in _loadPattern', error)
    }
  }


  /**
   * 
   *
   * @param {*} fetchPatternURL
   * @param {*} options 
   * @memberof ZwiftMemoryMonitor
   */
  loadURL(fetchPatternURL, options = {}) {

    if (!this._ready) return false;

    //
    if (!fetchPatternURL) {
      this.log('no fetchPatternURL')
      this.emit('status.error', 'no fetchPatternURL')
      this.emit('error', 'no fetchPatternURL')
      throw new Error('no fetchPatternURL in loadURL')
    } else {
      fetch(fetchPatternURL, options)
        .then((response) => {
          return response.json();
        })
        .catch()
        .then((data) => {
          this.logDebug(JSON.stringify(data, '', 2))

          let type = data[0]?.type ?? null
          if (!type) {
            const hash = crypto.createHash('sha256');
            hash.update(fetchPatternURL);
            const urlHash = hash.digest('hex');
            type = urlHash
          }

          this._patterns.set(type, data)
          this.emit('status.loaded', type)
          this.emit('loaded', this.loadedTypes)
        })
        .catch()
    }
  }


  get loadedTypes() {
    // return array from this._patterns.keys()
    return Array.from(this._patterns.keys())
  }

  set loadedTypes(types) {
    // do nothing
  }


  /**
   *
   *
   * @param {boolean} [forceScan=false]
   * @memberof ZwiftMemoryMonitor
   */
  start(types = null, startOptions = {}) {

    if (!this._ready) throw new Error('not ready in start');

    startOptions = {
      // retry: false,
      forceScan: false,
      timeout: 100,
      debug: this._options.debug ?? false,
      ...startOptions
    }

    if (!types) {
      types = this.loadedTypes
    } else if (types && !Array.isArray(types)) {
      throw new Error('types must be null or an array')
    }

    // save the start parameters for later use in retry logic
    this._savedStartParam = { types: types, startOptions: startOptions }

    this._started = false

    this.emit('status.scanning', types)

    // if we don't have a process object, throw an error 
    if (!this._zwift.process) {
      this.log('Could not find a Zwift process')
      this.emit('status.error', 'Could not find a Zwift process')

      if (this._options.retry) {
        this.emit('status.retrying', 'Could not find a Zwift process')
        setTimeout(() => {
          this.start(types, startOptions)
        }, 10_000);
        return;
      } else {
        throw new Error('Could not find Zwift process')
      }
    }

    
    this._zwift.verifyProcess() // make sure that the process object is updated if necessary
    this.logDebug('process', this._zwift.process)

    // this._addresses = {}

    let zwiftversion = this._zwift.version

    this.logDebug(this._patterns)


    // let scanners = new Map()

    // iterate over all types and for each type, find the first matching signature in the lookup

    types.forEach((type) => {
      if (!this.loadedTypes.includes(type)) return;
      let lookups = this._patterns.get(type)
      if (lookups) {
        let lookup = lookups.find((lookup) => {
          return semver.satisfies(zwiftversion, lookup.versions)
        })
        if (lookup && lookup.signatures && lookup.signatures?.length > 0) {
          this.scanners.set(type, new ZwiftMemoryScanner(this, lookup, startOptions))

          // this._options.signatures = [ signature ]
          // this._options.offsets = lookup.offsets
          // this._start(startOptions.forceScan)

        }
      }
    })

    let started = true
    this.scanners.forEach((scanner, type) => {
      started = started && scanner.start();
    })
    // console.log('started', started)
    if (!started) {
      this.lasterror = 'Could not start scanner(s)'
      this.emit('status.error', 'Could not start scanner(s)')
      this.stop() // stop all scanners and retry if configured
    } else {
      this._started = true
      this.emit('status.started', types)
    }

    // // If configured in options then wait 10 seconds and try again
    // if (startOptions.retry && !this._started) {
    //   this.emit('status.retrying', this.lasterror)
    //   this._timeouts.set(startOptions.startId, setTimeout(() => {
    //     this.start(types, startOptions)
    //   }, 10_000));
    // }

  }


  stop(fullStop = false) {
    this.scanners.forEach((scanner, type) => {
      scanner.stop()
    })

    try {
      // this.logDebug('closing process', this._zwift._process)

      this._zwift.closeProcess()
    } catch (e) {
      this.log('error in closeProcess()', e)
    }

    this.emit('status.stopped')

    if (this._options?.keepalive && !fullStop) {
      this.emit('status.retrying', this.lasterror)
      setTimeout(() => {
        this.start()
      }, 10_000)
    }


  }
}




module.exports = ZwiftMemoryMonitor

