import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";

export interface CkRrectProps {
  x: number;
  y: number;
  width: number;
  height: number;
}

export default class RRect {
  x = 0;
  y = 0;
  width = 10;
  height = 10;
  private canvasKit: CanvasKit;
  private paint: Paint;
  private rr: Float32Array;

  readonly type: "skRrect" = "skRrect";

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    const paint = new canvasKit.Paint();
    paint.setColor(canvasKit.Color4f(0.9, 0, 0, 1.0));
    paint.setStyle(canvasKit.PaintStyle.Stroke);
    paint.setAntiAlias(true);
    this.paint = paint;
    const { x, y, width, height } = this;
    this.rr = this.canvasKit.RRectXY(
      this.canvasKit.LTRBRect(x, y, x + width, y + height),
      25,
      15
    );
  }

  render(canvas: Canvas) {
    canvas.drawRRect(this.rr, this.paint);
  }
}
