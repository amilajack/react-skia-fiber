import type {
  Color,
  Paint,
  CanvasKit,
  StrokeCap,
  StrokeJoin,
  PaintStyle,
  BlendMode,
} from "canvaskit-wasm";

export interface PaintProps {
  color?:
    | Color
    | string
    | [number, number, number]
    | [number, number, number, number];
  style?: PaintStyle | "stroke" | "fill";
  strokeCap?: StrokeCap;
  strokeJoin?: StrokeJoin;
  strokeMiter?: number;
  strokeWidth?: number;
  antiAlias?: boolean;
  blendMode?: BlendMode;
  alpha?: number;
  // colorFilter?: ColorFilter
  // imageFilter?: ImageFilter;
  // blendMode?: BlendMode;
  // filterQuality?: FilterQuality;
  // maskFilter?: MaskFilter
  // pathEffect?: PathEffect
  // shader?: Shader
}

/**
 * Takes in a CSS color value and returns a CanvasKit.Color (which is an array of 4 floats in RGBA order).
 *
 * @example
 * ```ts
 * toSkColor(ck, [255, 1, 0])
 * toSkColor(ck, [255, 100, 10, 0.5])
 * ```
 */
export const toSkColor = (
  canvasKit: CanvasKit,
  color: string | Float32Array | Array<number>
): Color => {
  if (typeof color === "string") {
    return canvasKit.parseColorString(color);
  }
  const [r, g, b, a] = color;
  return canvasKit.Color(r, g, b, a ?? 1);
};

/**
 * Convert a declarative paint object to a canvaskit `Paint` object
 *
 * @example
 * ```ts
 * toSkPaint(ck, {
 *   color: 'red'
 * })
 * ```
 */
export const toSkPaint = (
  canvasKit: CanvasKit,
  skPaint: Paint,
  props: PaintProps
): Paint => {
  const skColor =
    typeof props.color === "string"
      ? canvasKit._testing.parseColor(props.color || "black")
      : props.color;
  if (skColor) {
    skPaint.setColor(skColor);
  }

  if (props.style) {
    let style: PaintStyle;
    if (typeof props.style === "string") {
      style =
        props.style === "stroke"
          ? canvasKit.PaintStyle.Stroke
          : canvasKit.PaintStyle.Fill;
    } else {
      style = props.style;
    }
    skPaint.setStyle(style);
  }
  if (props.strokeMiter) skPaint.setStrokeMiter(props.strokeMiter);
  if (props.strokeWidth) skPaint.setStrokeWidth(props.strokeWidth);
  if (props.antiAlias) skPaint.setAntiAlias(props.antiAlias);
  if (props.blendMode) skPaint.setBlendMode(props.blendMode);
  if (props.alpha) skPaint.setAlphaf(props.alpha);
  // TODO filterQuality?: FilterQuality;
  // TODO strokeCap?: StrokeCap;
  // TODO strokeJoin?: StrokeJoin;
  // TODO colorFilter?: ColorFilter
  // TODO imageFilter?: ImageFilter;
  // TODO maskFilter?: MaskFilter
  // TODO pathEffect?: PathEffect
  // TODO shader?: Shader

  return skPaint;
};
