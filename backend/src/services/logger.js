const logger = {
  info: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [INFO] 🔵 ${message}`, data || '');
  },
  warn: (message, data) => {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] [WARN] 🟠 ${message}`, data || '');
  },
  error: (message, error) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [ERROR] 🔴 ${message}`, error || '');
  },
  success: (message, data) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [SUCCESS] 🟢 ${message}`, data || '');
  }
};

export default logger;