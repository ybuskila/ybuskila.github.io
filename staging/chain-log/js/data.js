/* שכבת הנתונים - הדרך היחידה של המסך להגיע ללוג.
   log.txt הוא עותק של code-projects/chain-log/log.md, ש-build.py מעתיק לתוצר אחרי הבדיקות
   (.txt ולא .md - GitHub Pages מריץ Jekyll, ו-.md עלול להיות מומר ל-HTML). */
import { parseLog } from './parse.js';

export const LOG_URL = 'log.txt';
export const LOG_SOURCE = 'code-projects/chain-log/log.md';

export class LogError extends Error {
  constructor(reason) { super(reason); this.reason = reason; }
}

export async function loadLog() {
  let res;
  try {
    res = await fetch(LOG_URL, { cache: 'no-store' });
  } catch {
    throw new LogError('אין חיבור לשרת שמגיש את הדף, או שהדף נפתח כקובץ מקומי ולא דרך שרת.');
  }
  if (res.status === 404) throw new LogError('הקובץ לא נמצא בכתובת שהדף מצפה לה.');
  if (!res.ok) throw new LogError('השרת החזיר שגיאה ' + res.status + '.');
  return parseLog(await res.text());
}
