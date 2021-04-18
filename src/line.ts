import type { CanvasKit, SkPaint } from "canvaskit-oc";
import { is } from "./is";

export interface CkLineProps extends CkElementProps<never> {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  paint?: Paint;
}

export default class CkLine implements CkElement<"skLine"> {
  readonly canvasKit: CanvasKit;
  readonly skObjectType: CkObjectTyping["skLine"]["name"] = "Line";
  readonly type: "skLine" = "skLine";

  x1 = 0;
  x2 = 10;
  y1 = 10;
  y2 = 0;

  private readonly defaultPaint: SkPaint;
  private renderPaint?: SkPaint;
  deleted = false;

  constructor(canvasKit: CanvasKit) {
    this.canvasKit = canvasKit;

    this.defaultPaint = new this.canvasKit.SkPaint();
    this.defaultPaint.setColor(this.canvasKit.Color(0.9, 0, 0, 1.0));
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.defaultPaint.setAntiAlias(true);
  }

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error("BUG. line element deleted.");
    }
      // TODO we can be smart and only recreate the paint object if the paint props have changed.
      // this.renderPaint.delete();

      parent.skObject.drawLine(
        this.x1,
        this.y1,
        this.x2,
        this.y2,
        this.defaultPaint
      );
      this.deleted = false;
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.defaultPaint.delete();
    this.renderPaint?.delete();
  }
}
