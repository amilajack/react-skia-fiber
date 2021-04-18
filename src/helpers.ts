import { CanvasKit, SkColor } from "canvaskit-oc"

export interface Color {
  red: number,
  green: number,
  blue: number,
  alpha?: number
}

export const toSkColor = (canvasKit: CanvasKit, color: Color | string): SkColor | undefined => {
  if (typeof color === 'string') {
    // @ts-ignore
    return <SkColor>canvasKit.parseColorString(color)
  } else {
    return color ? canvasKit.Color(color.red, color.green, color.blue, color.alpha ?? 1) : undefined
  }
}
