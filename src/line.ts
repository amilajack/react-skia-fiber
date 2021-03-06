import type { Canvas, CanvasKit, Paint } from "canvaskit-wasm";
import { SkChild, SkElementProps } from "./types";

export interface SkLineProps extends SkElementProps<SkLine> {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export class SkLine implements SkChild {
  readonly canvasKit: CanvasKit;
  readonly type = "skLine";

  private deleted = false;

  private readonly paint: Paint;
  private renderPaint?: Paint;

  dirty = false;
  dirtyLayout = false;
  layoutProperties = new Set<string>();

  x1: number = 0;
  y1: number = 0;
  x2: number = 10;
  y2: number = 10;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.paint = new this.canvasKit.Paint();
    this.paint.setColor(this.canvasKit.Color(0.9, 0, 0, 1.0));
    this.paint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.paint.setAntiAlias(true);
  }

  render(canvas: Canvas): void {
    canvas.drawLine(this.x1, this.y1, this.x2, this.y2, this.paint);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.paint.delete();
    this.renderPaint?.delete();
  }
}
