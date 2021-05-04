import { SkChild, SkElementProps } from "./types";
import type { Canvas, CanvasKit, Paint, Path } from "canvaskit-wasm";

export interface SkPathProps extends SkElementProps<SkPath> {}

export class SkPath implements SkChild {
  readonly canvasKit: CanvasKit;
  readonly type = "skPath";

  private deleted = false;

  x1: number = 0;
  y1: number = 0;
  x2: number = 10;
  y2: number = 10;

  paint: Paint;
  path: Path;
  dirty = false;
  dirtyLayout = false;
  layoutProperties = new Set<string>();

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.path = new canvasKit.Path();
    this.paint = new this.canvasKit.Paint();
    this.paint.setColor(this.canvasKit.Color(0.9, 0, 0, 1.0));
    this.paint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.paint.setAntiAlias(true);
  }

  render(canvas: Canvas) {
    canvas.drawPath(this.path, this.paint);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) return;
    this.paint.delete();
    this.deleted = true;
  }
}
