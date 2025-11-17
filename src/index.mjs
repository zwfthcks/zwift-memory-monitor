// ESM entrypoint for zwift-memory-monitor
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Load the existing CommonJS implementation via createRequire so ESM consumers
// can import this package without changing the CJS sources.
const ZwiftMemoryMonitor = require('./ZwiftMemoryMonitor.js');

export default ZwiftMemoryMonitor;
export { ZwiftMemoryMonitor };
