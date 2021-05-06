import { SkChild, SkElementProps } from "./types";
import type {
  Canvas,
  CanvasKit,
  Paint,
  Path,
  PathCommand,
} from "canvaskit-wasm";
import { PaintProps, toSkPaint } from "./styles";

export interface SkPathProps extends SkElementProps<SkPath> {
  cmds?: PathCommand[];
  svg?: string;
  paint?: Paint;
  path?: Path;
  style?: PaintProps;
}

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
  dirtyPaint = false;
  layoutProperties = new Set<string>(["path", "svg", "cmds"]);

  cmds?: PathCommand[];
  svg?: string;
  style?: PaintProps;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;
    this.path = new canvasKit.Path();
    this.paint = new this.canvasKit.Paint();
    this.paint.setColor(this.canvasKit.Color(0.9, 0, 0, 1.0));
    this.paint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.paint.setAntiAlias(true);
  }

  private computeStyle() {
    if (this.style) toSkPaint(this.canvasKit, this.paint, this.style);
    this.dirtyPaint = false;
  }

  layout() {
    this.path?.delete();
    if (this.svg) {
      this.path = this.canvasKit.Path.MakeFromSVGString(this.svg)!;
    } else if (this.cmds) {
      this.path = this.canvasKit.Path.MakeFromCmds(this.cmds)!;
    }
  }

  render(canvas: Canvas) {
    if (this.dirtyLayout) this.layout();
    if (this.dirtyPaint) this.computeStyle();
    canvas.drawPath(this.path, this.paint);
    this.deleted = false;
  }

  delete() {
    if (this.deleted) return;
    this.paint.delete();
    this.deleted = true;
  }
}
