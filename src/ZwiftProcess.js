const memoryjs = require('memoryjs');

class ZwiftProcess {
  constructor(options = {}) {
    this.log = options?.log || (() => {});
    this.logDebug = options?.logDebug || this.log;
    this.exe = options?.exe || 'ZwiftApp.exe';
    this._process = null;
    this.lasterror = null;
    // allow sharing a pattern address cache from ZwiftData/other owner
    this._patternAddressCache = options?.patternAddressCache ?? new Map();
  }

  get process() {
    if (!this._process) {
      try {
        // clear any cached pattern addresses when opening a new process
        this._patternAddressCache?.clear?.();
      } catch (e) {}

      try {
        this._process = memoryjs.openProcess(this.exe);
        this.log('Zwift process:', this._process);
      } catch (e) {
        this.lasterror = 'Error in openProcess';
        // swallow error; caller can inspect lasterror
      }
    }

    return this._process ?? null;
  }

  set process(processObject) {
    this._process = processObject;
  }

  closeProcess() {
    try {
      if (this._process && this._process.handle) {
        memoryjs.closeHandle(this._process.handle);
      }
    } catch (e) {
      this.lasterror = 'Error in closeHandle';
    }
    this._process = null;
    try { this._patternAddressCache?.clear?.(); } catch (e) {}
  }

  verifyProcess() {
    if (this._process) {
      try {
        let isRunning = memoryjs.openProcess(this.exe);
        memoryjs.closeHandle(isRunning.handle);
        if (isRunning && (
          (this.process?.th32ProcessID !== isRunning?.th32ProcessID) ||
          (this.process?.th32ParentProcessID !== isRunning?.th32ParentProcessID) ||
          (this.process?.szExeFile !== isRunning?.szExeFile)
        )) {
          this.log('Zwift process changed from:', this.process, 'to:', isRunning);
          this.closeProcess();
          return false;
        }
        return !!isRunning;
      } catch (e) {
        this.lasterror = 'Error in isProcessRunning';
        this.closeProcess();
        return false;
      }
    }
    return false;
  }
}

module.exports = ZwiftProcess;
