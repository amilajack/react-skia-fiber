import type {
  Color,
  Paint,
  CanvasKit,
  StrokeCap,
  StrokeJoin,
  PaintStyle,
} from "canvaskit-wasm";

export interface PaintProps {
  color?: Color | string;
  style?: PaintStyle | "stroke" | "fill";
  strokeCap?: StrokeCap;
  strokeJoin?: StrokeJoin;
  strokeMiter?: number;
  strokeWidth?: number;
  antiAlias?: boolean;
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
  paint: PaintProps
): Paint => {
  // const skPaint = new canvasKit.Paint();

  const skColor =
    typeof paint.color === "string"
      ? canvasKit._testing.parseColor(paint.color || "black")
      : paint.color;
  if (skColor) {
    skPaint.setColor(skColor);
  }

  if (paint.style) {
    let style: PaintStyle;
    if (typeof paint.style === "string") {
      style =
        paint.style === "stroke"
          ? canvasKit.PaintStyle.Stroke
          : canvasKit.PaintStyle.Fill;
    } else {
      style = paint.style;
    }
    skPaint.setStyle(style);
  }
  if (paint.strokeMiter) {
    skPaint.setStrokeMiter(paint.strokeMiter);
  }
  if (paint.strokeWidth) {
    skPaint.setStrokeWidth(paint.strokeWidth);
  }
  if (paint.antiAlias) {
    skPaint.setAntiAlias(paint.antiAlias);
  }

  // TODO blendMode?: BlendMode;
  // TODO filterQuality?: FilterQuality;
  // TODO strokeCap?: StrokeCap;
  // TODO strokeJoin?: StrokeJoin;
  // TODO colorFilter?: ColorFilter
  // TODO imageFilter?: ImageFilter;
  // TODO maskFilter?: MaskFilter
  // TODO pathEffect?: PathEffect
  // TODO shader?: Shader
  // TODO style?: PaintStyle

  return skPaint;
};
