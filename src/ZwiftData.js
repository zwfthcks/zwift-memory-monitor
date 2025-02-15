const fs = require('node:fs');
const path = require('node:path');
const memoryjs = require('memoryjs');
const { getDocumentsPath } = require('platform-paths');

class ZwiftData {
    constructor(options = {}) {

        this.log = options?.log || console.log

        this.exe = options?.exe || 'ZwiftApp.exe'
        this.appFolder = options?.appFolder || ''
        this.zwiftVerCurFilenameTxtPath = options?.zwiftVerCurFilenameTxtPath || ''
        this.logTxtPath = options?.logTxtPath || ''
        this.prefsXmlPath = options?.prefsXmlPath || ''

        // override values (some or all) to avoid reading from files
        this._version = options?.version
        this._flagId = options?.flagId
        this._playerId = options?.playerId
        this._sportId = options?.sportId
        this._worldId = options?.worldId

        // find the path to %ProgramFiles(x86)%

        if (!this.appFolder) {
            try {
                let programFiles = process.env['ProgramFiles(x86)'] || process.env.ProgramFiles || 'C:\\Program Files (x86)';
                this.appFolder = path.resolve(programFiles, 'Zwift')
            } catch (e) {
                this.log('Error in finding Zwift app folder', e)
            }
        }

        this.verCurFilenameTxt = this.verCurFilenameTxt || path.resolve(this.appFolder, 'Zwift_ver_cur_filename.txt')

    }


    async init() {

        if (!this.logTxtPath || !this?.prefsxmlPath) {
            const documentsPath = await getDocumentsPath()
            if (!this?.zwiftlog) {
                // zwiftlog: path to log.txt for Zwift
                this.logTxtPath = path.resolve(documentsPath, 'Zwift', 'Logs', 'Log.txt')
            }
            if (!this?.prefsxmlPath) {
                // prefsxml: path to prefs.xml for Zwift
                this.prefsxmlPath = path.resolve(documentsPath, 'Zwift', 'prefs.xml')
            }
        }
        return true;
    }

    get process() {

        if (!this._process) {
            // Find the Zwift process
            try {
                this._process = memoryjs.openProcess(this.exe);
            } catch (e) {
                this.lasterror = 'Error in openProcess'
                // throw new Error('Error in openProcess', `${this.exe}`)
            }
        }

        return this._process ?? null
    }

    set process(processObject) {
        this.processObject = processObject
    }

    closeProcess() {
        try {
            memoryjs.closeHandle(this._process.handle)
            this._process = null
        } catch (e) {
            this.lasterror = 'Error in closeHandle'
            throw new Error('Error in closeHandle', `${this.exe}`)
        }
        this._process = null
    }

    get version() {
        if (!this._version) {
            this._version = this.getGameVersion() || '0.0.0'
        }
        return this._version
    }

    set version(version) {
        this._version = version
    }

    getGameVersion() {
        if (this._version) {
            return this._version
        }

        if (this.verCurFilenameTxt && fs.existsSync(this.verCurFilenameTxt)) {
            this.log('Zwift version filename file:', this.verCurFilenameTxt)
            try {
                let zwiftVerCurFilename = fs.readFileSync(this.verCurFilenameTxt, 'utf8').trim()
                let zwiftVerCurFile = path.resolve(this.appFolder, zwiftVerCurFilename)
                // remove trailing null bytes from zwiftVerCurFile
                zwiftVerCurFile = zwiftVerCurFile.replace(/\0/g, '')
                this.log('Zwift version file:', zwiftVerCurFile)
                let xml = fs.readFileSync(zwiftVerCurFile, 'utf8')
                // <Zwift version="1.0.139872" sversion="1.83.0 (139872)" gbranch="rc/1.83.0" gcommit="298e0a13bf6c23cfedb09968ae9490965c9e369c" GAME_URL="https://us-or-rly101.zwift.com" manifest="Zwift_1.0.139872_34608a9e_manifest.xml" manifest_checksum="-1006471014" ver_cur_checksum="-1183981758"/>
                // Find the version number in the XML in the sversion attribute
                let match = xml.match(/sversion="((?:\d+)\.(?:\d+)\.(?:\d+))/)
                if (match && match[1]) {
                    this.log(`Zwift seems to be version: ${match[1]}`)
                    // this.emit('info', `version ${match[1]}`)
                    return match[1]
                }
            } catch (e) {
                // 
                this.log('Error reading Zwift version file', e)
            }
        }

        // Fall back to reading from log.txt

        // Determine game version from log.txt
        const version = /\[(?:[^\]]*)\]\s+Game Version: ((?:\d+)\.(?:\d+)\.(?:\d+))/g;
        let gameVersion = this._getLast(version, 1) || '0.0.0';
        this.log(`Zwift seems to be version: ${gameVersion}`)

        return gameVersion;
    }


    //   this.log('Zwift log file:', this.logTxtPath)
    //   if (fs.existsSync(this.logTxtPath)) {
    //     try {
    //       let logtxt = fs.readFileSync(this.logTxtPath, 'utf8');

    //       // [15:56:28] Game Version: 1.26.1(101164) dda86fe0235debd7146c0d8ceb1b0d5d626ddf77
    //       let patterns = {
    //         version: /\[(?:[^\]]*)\]\s+Game Version: ((?:\d+)\.(?:\d+)\.(?:\d+))/g,
    //       };

    //       let match;

    //       while ((match = patterns.version.exec(logtxt)) !== null) {
    //         this.log(`Zwift seems to be version: ${match[1]}`);
    //         // this.emit('info', `version ${match[1]}`);
    //         return match[1];
    //       }
    //     } catch (error) {
    //       this.log('Error reading Zwift log file', error);
    //     }
    //   }
    // }


    getFlagId() {
        if ((this._flagId ?? undefined) !== undefined) {
            return this._flagId
        }
        // Determine country ID from prefs.xml
        this.log('Zwift prefs.xml file:', this.prefsxmlPath)
        if (fs.existsSync(this.prefsxmlPath)) {
            try {
                let prefsxmltxt = fs.readFileSync(this.prefsxmlPath, 'utf8');

                // <flag>208</flag>
                let patterns = {
                    flag: /<flag>(\d*)<\/flag>/g,
                }

                let match;

                while ((match = patterns.flag.exec(prefsxmltxt)) !== null) {
                    let flagid = parseInt(match[1]);
                    this.log(`Zwift seems to run with flag ID: ${flagid} = ${('00000000' + flagid.toString(16)).substr(-8)}`)
                    // this.emit('info', `flagid ${flagid}`)
                    return flagid
                }
            } catch (error) {
                this.log('Error reading Zwift prefs.xml file', error);
            }
        }
    }


    // getPlayerId() {
    //   // Determine player ID from log.txt
    //   this.log('Zwift log file:', this.logTxtPath)
    //   if (fs.existsSync(this.logTxtPath)) {
    //     try {
    //       let logtxt = fs.readFileSync(this.logTxtPath, 'utf8');

    //       // [12:02:30] NETCLIENT:[INFO] Player ID: 793163
    //       let patterns = {
    //         user :    /\[(?:[^\]]*)\]\s+(?:NETCLIENT:){0,1}\[INFO\] Player ID: (\d*)/g ,
    //       }

    //       let match;

    //       while ((match = patterns.user.exec(logtxt)) !== null) {
    //         let playerid = parseInt(match[1]);
    //         this.log(`Zwift seems to run with player ID: ${playerid} = ${('00000000' + playerid.toString(16)).substr(-8)}`)
    //         // this.emit('info', `playerid ${playerid}`)
    //         return playerid
    //       }
    //     } catch (error) {
    //       this.log('Error reading Zwift log file', error);
    //     }
    //   } 
    // }

    getPlayerId() {
        if ((this._playerId ?? undefined) !== undefined) {
            return this._playerId
        }
        const player = /\[(?:[^\]]*)\]\s+(?:NETCLIENT:){0,1}\[INFO\] Player ID: (\d*)/g;
        let found = this._getLast(player, 1)
        if (found) {
            let playerId = parseInt(found);
            this.log(`Zwift seems to run with player ID: ${playerId} = ${('00000000' + playerId.toString(16)).substr(-8)}`)
            return playerId
        }
    }

    getSportId() {
        if ((this._sportId ?? undefined) !== undefined) {
            return this._sportId
        }
        const sport = /\[([^\]]*)\]\s+Setting sport to (\S+)/g;
        let sportId = parseInt(this._getLast(sport, 2) || 0);
        this.log(`Zwift seems to run with sport ID: ${sportId} = ${('00000000' + sportId.toString(16)).substr(-8)}`)
        return sportId
    }


    getWorldId() {
        if ((this._worldId ?? undefined) !== undefined) {
            return this._worldId
        }
        const world = /\[([^\]]*)\]\s+Loading WAD file 'assets\/Worlds\/world(\d*)\/data.wad/g;
        let worldId = parseInt(this._getLast(world, 2) || 0);
        this.log(`Zwift seems to run in world ID: ${worldId} = ${('00000000' + worldId.toString(16)).substr(-8)}`)
        return worldId
    }


    _getLast(pattern, matchItem, key, description = '', emit = false) {
        // this.log('Zwift log file:', this._options.zwiftlog)
        if (fs.existsSync(this.logTxtPath)) {
            try {
                let logtxt = fs.readFileSync(this.logTxtPath, 'utf8');

                let match;
                let result;

                while ((match = pattern.exec(logtxt)) !== null) {
                    result = match[matchItem];
                }

                return result;
            } catch (error) {
                this.log('Error reading Zwift log file', error);
            }
        }
    }


}

module.exports = ZwiftData;