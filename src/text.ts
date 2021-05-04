import type { CanvasKit, Font, Paint } from "canvaskit-wasm";
import { Canvas } from "canvaskit-wasm";
import { SkElementProps } from "./types";

export interface SkTextProps extends SkElementProps<SkText> {
  text?: string;
  x?: number;
  y?: number;
}

export class SkText {
  readonly canvasKit: CanvasKit;
  readonly type: "skText" = "skText";

  private readonly paint: Paint;
  private readonly defaultFont: Font;
  private renderPaint?: Paint;
  private renderFont?: Font;

  readonly layoutProperties = new Set<string>(["x", "y"]);
  dirtyLayout = false;
  deleted = false;
  x = 0;
  y = 0;
  text = "hello";

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;

    this.paint = new this.canvasKit.Paint();
    this.paint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.paint.setAntiAlias(true);
    this.defaultFont = new this.canvasKit.Font(null, 40);
  }

  render(canvas: Canvas): void {
    canvas.drawText(this.text, this.x, this.y, this.paint, this.defaultFont);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.defaultFont.delete();
    this.paint.delete();
    this.renderPaint?.delete();
    this.renderFont?.delete();
  }
}
