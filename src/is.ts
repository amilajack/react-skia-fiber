import CkCanvas from "./canvas"
import CkParagraph from "./paragraph"
import { CkSurface } from "./surface"

export const is = {
  obj: (a: any) => a === Object(a) && !is.arr(a) && typeof a !== 'function',
  fun: (a: any) => typeof a === 'function',
  str: (a: any) => typeof a === 'string',
  num: (a: any) => typeof a === 'number',
  und: (a: any) => a === void 0,
  arr: (a: any) => Array.isArray(a),
  surface: (a: any) => a.type === 'skSurface',
  canvas: (a: any) => a.type === 'skCanvas',
  paragraph: (a: any) => a.type === 'skParagraph',
  text: (a: any) => a.type === 'skText',
  equ(a: any, b: any) {
    // Wrong type or one of the two undefined, doesn't match
    if (typeof a !== typeof b || !!a !== !!b) return false
    // Atomic, just compare a against b
    if (is.str(a) || is.num(a) || is.obj(a)) return a === b
    // Array, shallow compare first to see if it's a match
    if (is.arr(a) && a == b) return true
    // Last resort, go through keys
    let i
    for (i in a) if (!(i in b)) return false
    for (i in b) if (a[i] !== b[i]) return false
    return is.und(i) ? a === b : true
  },
}
