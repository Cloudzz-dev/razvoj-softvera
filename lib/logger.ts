const SENSITIVE_KEYS = ["password", "token", "secret", "key", "authorization"];

function redact(obj: any): any {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(redact);
  }

  const redactedObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        redactedObj[key] = "[REDACTED]";
      } else {
        redactedObj[key] = redact(obj[key]);
      }
    }
  }
  return redactedObj;
}

export const logger = {
    info: (message: string, meta?: any) => {
        console.log(JSON.stringify(redact({ level: 'info', message, meta, timestamp: new Date().toISOString() })));
    },
    error: (message: string, error?: any, meta?: any) => {
        console.error(JSON.stringify(redact({
            level: 'error',
            message,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined,
            meta,
            timestamp: new Date().toISOString()
        })));
    },
    warn: (message: string, meta?: any) => {
        console.warn(JSON.stringify(redact({ level: 'warn', message, meta, timestamp: new Date().toISOString() })));
    }
};
