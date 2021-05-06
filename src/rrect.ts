import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { PaintProps, toSkPaint } from "./styles";
import { SkChild, SkElementProps } from "./types";

export interface SkRRectProps extends SkElementProps<SkRRect> {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  paint?: Paint;
  style?: PaintProps;
}

export class SkRRect implements SkChild {
  x = 0;
  y = 0;
  rx = 10;
  ry = 10;
  width = 100;
  height = 100;
  canvasKit: CanvasKit;
  paint: Paint;
  style?: PaintProps;
  private rr?: Float32Array;

  readonly layoutProperties = new Set<string>([
    "x",
    "y",
    "rx",
    "ry",
    "width",
    "height",
  ]);
  dirtyLayout = true;
  dirtyPaint = true;

  readonly type: "skRrect" = "skRrect";

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.paint = new canvasKit.Paint();
    this.layout();
  }

  private computeStyle() {
    if (this.style) toSkPaint(this.canvasKit, this.paint, this.style);
    this.dirtyPaint = false;
  }

  layout() {
    const { x, y, width, height } = this;
    this.rr = this.canvasKit.RRectXY(
      this.canvasKit.LTRBRect(x, y, x + width, y + height),
      this.rx,
      this.ry
    );
    this.dirtyLayout = false;
  }

  render(canvas: Canvas) {
    if (this.dirtyLayout) this.layout();
    if (this.dirtyPaint) this.computeStyle();
    canvas.drawRRect(this.rr!, this.paint);
  }

  delete() {}
}
