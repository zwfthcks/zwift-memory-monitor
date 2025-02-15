/**
 * @module @zwfthcks/ZwiftMemoryMonitor
 * 
 */



const EventEmitter = require('node:events')
const memoryjs = require('memoryjs');
const semver = require('semver')
const { getDocumentsPath } = require('platform-paths');

const fs = require('node:fs');
const path = require('node:path')
const os = require('node:os')

const lookupPatterns = require('./lookup.js')

// const documentsPath = getDocumentsPath()


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

    // bind this for functions
    this._checkBaseAddress = this._checkBaseAddress.bind(this)
    this._getCachedScan = this._getCachedScan.bind(this)
    this._writeCachedScanFile = this._writeCachedScanFile.bind(this)
    this._readCachedScanFile = this._readCachedScanFile.bind(this)
    this._searchWithHeuristicSignature = this._searchWithHeuristicSignature.bind(this)
    this.readPlayerData = this.readPlayerData.bind(this)

    // initialise _options object with defaults and user set options
    this._options = {
      // zwiftlog: path to log.txt for Zwift
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

    if (!this._options.lookup && (!this._options.offsets || !this._options.signatures)) {
      this._options.lookup = Object.values(lookupPatterns)?.shift()
      this._options.type = Object.keys(lookupPatterns)?.shift()
    } 

    // log can be set to e.g. console.log in options
    this.log = this._options?.log || (() => { }) 

    // initial values
    this._started = false


    // find the path to %ProgramFiles(x86)%

    try {
      let programFiles = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles || 'C:\\Program Files (x86)';
      this._options.zwiftAppFolder = path.resolve(programFiles, 'Zwift')
      this._options.zwiftVerCurFilenameTxt = path.resolve(this._options.zwiftAppFolder, 'Zwift_ver_cur_filename.txt')
    } catch (e) {
      this.log('Error in finding Zwift app folder', e)
    }

    // 
    if (!options?.zwiftlog) {
      getDocumentsPath().then((documentsPath) => {
        // zwiftlog: path to log.txt for Zwift
        this._options.zwiftlog = path.resolve(documentsPath, 'Zwift', 'Logs', 'Log.txt')
        this._ready = true
        this.emit('ready')
      })
    } else {
      this._ready = true
      this.emit('ready')
    }

    
  }

  /**
   * @param {*} type 
   */
  loadType(type) {

    if (!this._ready) return false;

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
      this.emit('status.error', this.lasterror, error)
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
   * @param {*} options 
   * @memberof ZwiftMemoryMonitor
   */
  loadURL(fetchLookupURL, options = {}) {

    if (!this._ready) return false;

    //
    if (!fetchLookupURL) {
      this.log('no fetchURL')
      this.emit('status.loaded')
      
    } else {
      fetch(fetchLookupURL, options)
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
    
    if (!this._ready) return false;

    this.emit('status.scanning')

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
      
      // if provided an old version style signature instead of signatures (array), simply
      // create the signatures array from it 
      if (!this._options?.signatures && this._options?.signature) {
        this._options.signatures = [ this._options.signature ]
      }

      // if signatures or offsets are overridden in object initialisation they will be used
      // but otherwise _options.lookup will be searched for first entry matching the game version
      if (!this._options?.signatures || !this._options?.offsets) {
        let lookupFound = this?._options.lookup.find((entry) => {
          return semver.satisfies(this._zwiftversion, entry.versions)
        })

        if (lookupFound && lookupFound.signatures && !this._options.signatures) {
          this._options.signatures = lookupFound.signatures
        }
        if (lookupFound && lookupFound.signature && !this._options.signatures) {
          // if provided an old version style signature instead of signatures (array), simply
          // create the signatures array from it 
          this._options.signatures = [ lookupFound.signatures ]
        }
        if (lookupFound && !this._options.offsets) {
          this._options.offsets = lookupFound.offsets
        }
      }

      if (this._options?.signatures) {
        this._playerid = this._options?.playerid || this._getPlayerid() || 0
      } else {
        this.lasterror = 'Missing signature for current game version'
      }
  
      if (this._options?.signatures && this?._playerid > 0) {
        
        let playeridPattern = ('00000000' + this._playerid.toString(16)).slice(-8).match(/../g).reverse().join(' ')

        let cachedScan = undefined;

        if (!forceScan) {
          cachedScan = this._getCachedScan()
        }

        if (!forceScan && cachedScan?.baseaddress) {
          this._checkBaseAddress(null, cachedScan.baseaddress)
        } else {
          this._options.signatures.some((signature) => {
            
            if (!signature.pattern) {
              // convert old style start+end signature to new style pattern
              signature.pattern = `${signature?.start} <player> ${signature?.end}`
            }
            let pattern = signature.pattern.replace(/<player>/ig, playeridPattern)
            this.log(pattern);

            let addressOffset = signature?.addressOffset || 0;
    
            this.lasterror = null

            if (signature.heuristic) {
              // heuristic signature
              let heuristic = {
                min: signature.heuristic.min ?? 8 + 16 * 4,
                max: signature.heuristic.max ?? 8 + 32 * 4,
                mustMatch: signature.heuristic.mustMatch ?? [ ],
                mustDiffer: signature.heuristic.mustDiffer ?? [ ],
                mustBeGreaterThanEqual: signature.heuristic.mustBeGreaterThanEqual ?? null,
                mustBeLessThanEqual: signature.heuristic.mustBeLessThanEqual ?? null,
              }
              this._searchWithHeuristicSignature(this._processObject, pattern, heuristic, addressOffset, this._checkBaseAddress)
            } else {
              memoryjs.findPattern(this._processObject.handle, pattern, memoryjs.NORMAL, addressOffset, this._checkBaseAddress);
            }
            return this._started // will break iteration on first pattern found

          })  
        }

        
      } else {
        this.lasterror = 'Player ID not found'
      }
      
    }
    
    // If configured in options then wait 10 seconds and try again
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
      
      // this.log(this._addresses)
      
      this._interval = setInterval(this.readPlayerData, this._options.timeout)
      this._started = true

      this.emit('status.started')
      
    } 

    return this._started
    
  }


  /**
   * Searches for a pattern in memory regions of a process using a heuristic signature.
   *
   * @param {object} processObject - The process object containing the handle of the target process.
   * @param {string} pattern - The pattern to search for in memory regions.
   * @param {object} heuristic - The heuristic object containing the minimum and maximum offset values.
   * @param {number} addressOffset - The offset to be added to the found address.
   * @param {function} callback - The callback function to be called with the found address.
   * @returns {void}
   */
  _searchWithHeuristicSignature(processObject, pattern, heuristic, addressOffset, callback) {
    //

    this.log('searchWithHeuristicSignature', pattern, heuristic, addressOffset)

    let regions = memoryjs.getRegions(processObject.handle);
    
    let hexPattern = pattern.split(' ').join('')
    
    let chunkSize = 1024 * 1024 * 2;
    let overlap = hexPattern.length / 2;

    let foundAddresses = [];
    
    let regionBuffer;
    
    regions.forEach((region) => {
      if (region.szExeFile) return; // skip this region if szExeFile is set
    
      let baseAddress = region.BaseAddress
    
      while (baseAddress < region.BaseAddress + region.RegionSize) {
        regionBuffer = memoryjs.readBuffer(processObject.handle, baseAddress, Math.min(chunkSize, region.BaseAddress + region.RegionSize - baseAddress));
        // this.log(regionBuffer.toString('hex'))
        // this.log(regionBuffer)
        
        let patternIndex;
        let byteOffset = 0;
        
        do {
          patternIndex = regionBuffer.indexOf(hexPattern, byteOffset, 'hex');  // the first occurrence of the pattern (if any)
          
          if (patternIndex >= 0) {
            // this.log('FOUND PATTERN AT', patternIndex, 'in region', region.BaseAddress, 'from chunk at', baseAddress.toString(16).toUpperCase())
            // this.log(regionBuffer)
            // this.log('at patternIndex', patternIndex)
            // this.log(regionBuffer.slice(patternIndex, patternIndex + (hexPattern.length / 2)).toString('hex'))
            // this.log(regionBuffer.slice(patternIndex, patternIndex + (hexPattern.length / 2)).toString('utf8'))
            
            // this.log('at address:', baseAddress + patternIndex, (baseAddress + patternIndex).toString(16).toUpperCase())
    
            
            let readBack = memoryjs.readBuffer(processObject.handle, baseAddress + patternIndex, hexPattern.length / 2).toString('hex')
            if (readBack == hexPattern) {
              foundAddresses.push((baseAddress + patternIndex).toString(16).toUpperCase())
            }
    
            // this.log('reading back:',memoryjs.readBuffer(processObject.handle, baseAddress + patternIndex, hexPattern.length / 2).toString('hex'))
            
            byteOffset = patternIndex + (hexPattern.length / 2) + 1
          }
        } while (patternIndex >= 0)
    
        baseAddress += chunkSize - overlap
      }
    
    
    })
    
    // filter out duplicates and verify that the pattern still is at the found address
    foundAddresses = [...new Set(foundAddresses)].filter((address) => {
      return hexPattern == memoryjs.readBuffer(processObject.handle, parseInt(address, 16), hexPattern.length / 2).toString('hex')
    })
    
    this.log('FOUND ADDRESSES:')
    this.log(foundAddresses)

    // loop through foundAddresses and calculate the offset between two adjacent elements
    let offsets = [];
    let lastAddress = 0;
    foundAddresses.forEach((address) => {
      
      let thisAddress = parseInt(address, 16);
      if (lastAddress) {
        offsets.push({
          address: address,
          offset: thisAddress - lastAddress
        })
      }
      lastAddress = thisAddress;

    })
    
    this.log('OFFSETS:')
    this.log(offsets)
    
    // the wanted address is the one that has offset approx. 120 (8 + 28*4) from the previous one
    let wantedAddress = 0;
    let wantedOffset;;
    offsets.some( (offset) => {
      if ((offset.offset >= (heuristic.min ?? 0)) && (offset.offset <= (heuristic.max ?? 0) && offset.offset % 4 == 0)) {

        this.log('CHECKING this address:', offset.address)

        if (heuristic.mustMatch.length > 0) {

          let match = heuristic.mustMatch.every((mustMatchEntry) => {
            // this.log('mustMatchEntry', mustMatchEntry)
            // this.log('1:', memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) - offset.offset + mustMatchEntry, memoryjs.UINT32))
            // this.log('2:', memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) + mustMatchEntry, memoryjs.UINT32))

            return memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) - offset.offset + mustMatchEntry, memoryjs.UINT32) ==
              memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) + mustMatchEntry, memoryjs.UINT32)
          })
          this.log('match = ', match)
          if (!match) {
            this.log('Not the wanted address:', offset.address)
            return false;
          }

        }

        if (heuristic.mustDiffer.length > 0) {

          let differ = heuristic.mustDiffer.every((mustDifferEntry) => {
            // this.log('mustDifferEntry', mustDifferEntry)
            // this.log('1:', memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) - offset.offset + mustDifferEntry, memoryjs.UINT32))
            // this.log('2:', memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) + mustDifferEntry, memoryjs.UINT32))
            // this.log('verify 1 base:', memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) - offset.offset, memoryjs.UINT32))
            // this.log('verify 2 base:', memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16), memoryjs.UINT32))

            return memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) - offset.offset + mustDifferEntry, memoryjs.UINT32) !=
              memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) + mustDifferEntry, memoryjs.UINT32)
          })
          this.log('differ = ', differ)
          if (!differ) {
            this.log('Not the wanted address:', offset.address)
            return false;
          }
        
        }

        if (heuristic.mustBeGreaterThanEqual) {

          // mustBeGreaterThanEqual: {
          //   power: [0x34, 'uint32', 0],
          //   heartrate: [0x30, 'uint32', 0]
          // },
          
          // loop over the mustBeGreaterThanEqual object and check that the value at the address is greater than or equal to the value
          let greaterThanEqual = Object.keys(heuristic.mustBeGreaterThanEqual).every((key) => {
            let value = heuristic.mustBeGreaterThanEqual[key][2];
            let type = heuristic.mustBeGreaterThanEqual[key][1];
            let offsetToRead = heuristic.mustBeGreaterThanEqual[key][0];

            let readValue = memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) + offsetToRead, type);
            // this.log('readValue', readValue);
            // this.log('value', value);
            return readValue >= value;
          });
          this.log('greaterThanEqual = ', greaterThanEqual);
          if (!greaterThanEqual) {
            this.log('Not the wanted address:', offset.address);
            return false;
          }
        }

        if (heuristic.mustBeLessThanEqual) {

          // mustBeLessThanEqual: {
          //   power: [0x34, 'uint32', 0],
          //   heartrate: [0x30, 'uint32', 0]
          // },
          
          // loop over the mustBeLessThanEqual object and check that the value at the address is greater than or equal to the value
          let lessThanEqual = Object.keys(heuristic.mustBeLessThanEqual).every((key) => {
            let value = heuristic.mustBeLessThanEqual[key][2];
            let type = heuristic.mustBeLessThanEqual[key][1];
            let offsetToRead = heuristic.mustBeLessThanEqual[key][0];

            let readValue = memoryjs.readMemory(processObject.handle, parseInt(offset.address, 16) + offsetToRead, type);
            // this.log('readValue', readValue);
            // this.log('value', value);
            return readValue <= value;
          });
          this.log('lessThanEqual = ', lessThanEqual);
          if (!lessThanEqual) {
            this.log('Not the wanted address:', offset.address);
            return false;
          }
        }

  
        this.log('ALL CHECKS TRUE for', offset.address)

        wantedAddress = parseInt(offset.address, 16);
        wantedOffset = offset.offset;
        return true;
      }
    })
    
    this.log('WANTED ADDRESS and OFFSET:')
    this.log(wantedAddress.toString(16).toUpperCase(), wantedOffset ? `${wantedOffset} ( = 8 + ${(wantedOffset-8)/4}*4 )` : '')
  
    if (wantedAddress) {
      callback(null, wantedAddress + addressOffset)
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
    
    if (!this._ready) return false;

    this._started = false

    clearInterval(this._interval)
    
    if (this?._retryTimeout) {
      clearTimeout(this._retryTimeout)
    }
    
    try {
      memoryjs.closeHandle(this?.processObject?.handle)
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

        if (playerData?.roadtime >= 0) {
          playerData.roadtime = (playerData?.roadtime - 5_000) / 1_000_000
        }

        playerData.powerMeter = (playerData.f19 & 0x1) ? true : false;
        playerData.companionApp = (playerData.f19 & 0x2) ? true : false;
        playerData.forward = (playerData.f19 & 0x4) ? true : false;
        playerData.uTurn = (playerData.f19 & 0x8) ? true : false;

        playerData.rideons = (playerData.f19 >> 24) & 0xFF;
            
        playerData.roadId = (playerData.f20 >> 8) & 0xFFFF;
        playerData.isPortalRoad = (playerData.roadId >= 10000) || false;

        playerData.gradientScalePct = 50 + playerData.gradientScale * 25;

        // verify by reading player id back from memory
        if (this._playerid != memoryjs.readMemory(this._processObject.handle, this._baseaddress, memoryjs.UINT32)) {
          // Probably because Zwift was closed...
          this.lasterror = 'Could not verify player ID in memory'
          throw new Error(this.lasterror)
        }

        playerData.units = {
          distance: 'm',
          elevation: 'm',
          speed: 'mm/h',
          power: 'W',
          heartrate: 'bpm',
          cadence: 'rpm',
          calories: 'kcal',
        }

        playerData.packetInfo = {
          source: 'zmm',
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
      try {
        let logtxt = fs.readFileSync(this._options.zwiftlog, 'utf8');
        
        // [12:02:30] NETCLIENT:[INFO] Player ID: 793163
        let patterns = {
          user :    /\[(?:[^\]]*)\]\s+(?:NETCLIENT:){0,1}\[INFO\] Player ID: (\d*)/g ,
        }
        
        let match;
        
        while ((match = patterns.user.exec(logtxt)) !== null) {
          let playerid = parseInt(match[1]);
          this.log(`Zwift seems to run with player ID: ${playerid} = ${('00000000' + playerid.toString(16)).substr(-8)}`)
          this.emit('info', `playerid ${playerid}`)
          return playerid
        }
      } catch (error) {
        this.log('Error reading Zwift log file', error);
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

    if (this._options.zwiftVerCurFilenameTxt && fs.existsSync(this._options.zwiftVerCurFilenameTxt)) {
      this.log('Zwift version filename file:', this._options.zwiftVerCurFilenameTxt)
      try {
        let zwiftVerCurFilename = fs.readFileSync(this._options.zwiftVerCurFilenameTxt, 'utf8').trim()
        let zwiftVerCurFile = path.resolve(this._options.zwiftAppFolder, zwiftVerCurFilename)
        // remove trailing null bytes from zwiftVerCurFile
        zwiftVerCurFile = zwiftVerCurFile.replace(/\0/g, '')
        this.log('Zwift version file:', zwiftVerCurFile)
        let xml = fs.readFileSync(zwiftVerCurFile, 'utf8') 
        // <Zwift version="1.0.139872" sversion="1.83.0 (139872)" gbranch="rc/1.83.0" gcommit="298e0a13bf6c23cfedb09968ae9490965c9e369c" GAME_URL="https://us-or-rly101.zwift.com" manifest="Zwift_1.0.139872_34608a9e_manifest.xml" manifest_checksum="-1006471014" ver_cur_checksum="-1183981758"/>
        // Find the version number in the XML in the sversion attribute
        let match = xml.match(/sversion="((?:\d+)\.(?:\d+)\.(?:\d+))/)
        if (match && match[1]) {
          this.log(`Zwift seems to be version: ${match[1]}`)
          this.emit('info', `version ${match[1]}`)
          return match[1]
        }
      } catch (e) {
        // 
        this.log('Error reading Zwift version file', e)
      }
    }

    // Fall back to reading from log.txt

    // Determine game version from log.txt
    this.log('Zwift log file:', this._options.zwiftlog)
    if (fs.existsSync(this._options.zwiftlog)) {
      try {
        let logtxt = fs.readFileSync(this._options.zwiftlog, 'utf8');

        // [15:56:28] Game Version: 1.26.1(101164) dda86fe0235debd7146c0d8ceb1b0d5d626ddf77
        let patterns = {
          version: /\[(?:[^\]]*)\]\s+Game Version: ((?:\d+)\.(?:\d+)\.(?:\d+))/g,
        };

        let match;

        while ((match = patterns.version.exec(logtxt)) !== null) {
          this.log(`Zwift seems to be version: ${match[1]}`);
          this.emit('info', `version ${match[1]}`);
          return match[1];
        }
      } catch (error) {
        this.log('Error reading Zwift log file', error);
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

