function timestamp() {
  return new Date().toISOString();
}

module.exports = {
  info: (msg, meta = {}) => console.log(`[${timestamp()}] INFO  ${msg}`, meta),
  warn: (msg, meta = {}) => console.warn(`[${timestamp()}] WARN  ${msg}`, meta),
  error: (msg, meta = {}) => console.error(`[${timestamp()}] ERROR ${msg}`, meta)
};
