import { SkCanvas } from "./canvas";
import { SkParagraph } from "./paragraph";
import { SkSurface } from "./surface";
import { SkText } from "./text";

export const is = {
  obj: (a: any) => a === Object(a) && !is.arr(a) && typeof a !== "function",
  fun: (a: any): a is Function => typeof a === "function",
  str: (a: any): a is string => typeof a === "string",
  num: (a: any): a is number => typeof a === "number",
  und: (a: any) => a === void 0,
  arr: (a: any) => Array.isArray(a),
  surface: (a: any): a is SkSurface => a.type === "skSurface",
  canvas: (a: any): a is SkCanvas => a.type === "skCanvas",
  paragraph: (a: any): a is SkParagraph => a.type === "skParagraph",
  text: (a: any): a is SkText => a.type === "skText",
  equ(a: any, b: any) {
    // Wrong type or one of the two undefined, doesn't match
    if (typeof a !== typeof b || !!a !== !!b) return false;
    // Atomic, just compare a against b
    if (is.str(a) || is.num(a) || is.obj(a)) return a === b;
    // Array, shallow compare first to see if it's a match
    if (is.arr(a) && a == b) return true;
    // Last resort, go through keys
    let i;
    for (i in a) if (!(i in b)) return false;
    for (i in b) if (a[i] !== b[i]) return false;
    return is.und(i) ? a === b : true;
  },
};
