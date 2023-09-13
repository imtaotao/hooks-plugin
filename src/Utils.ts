const objectToString = Object.prototype.toString;

export function isPlainObject(val: unknown): val is Object {
  return objectToString.call(val) === "[object Object]";
}

export function checkReturnData(
  originData: Record<string, unknown>,
  returnData: Record<string, unknown>
) {
  if (!isPlainObject(returnData)) return false;
  if (originData !== returnData) {
    for (const key in originData) {
      if (!(key in returnData)) {
        return false;
      }
    }
  }
  return true;
}

export const PREFIX = "[hooksPlugin]";
export function assert(condition: unknown, error?: string | Error) {
  if (!condition) {
    try {
      if (typeof error === "string") {
        error = `${PREFIX}: ${error}`;
      } else if (error instanceof Error) {
        if (!error.message.startsWith(PREFIX)) {
          error.message = `${PREFIX}: ${error.message}`;
        }
      }
    } catch (e) {
      // don't do anything
    }
    throw error;
  }
}
