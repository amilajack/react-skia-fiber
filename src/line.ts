import type { CanvasKit, SkPaint } from "canvaskit-oc";
import { isCkCanvas } from "./canvas";
import { toSkPaint } from "./mappings";
import {
  CkElement,
  CkElementContainer,
  CkElementCreator,
  CkElementProps,
  CkObjectTyping,
  Paint,
} from "./types";

export interface CkLineProps extends CkElementProps<never> {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  paint?: Paint;
}

class CkLine implements CkElement<"skLine"> {
  readonly canvasKit: CanvasKit;
  readonly props: CkObjectTyping["skLine"]["props"];
  readonly skObjectType: CkObjectTyping["skLine"]["name"] = "Line";
  readonly type: "skLine" = "skLine";

  private readonly defaultPaint: SkPaint;
  private renderPaint?: SkPaint;
  deleted = false;

  constructor(canvasKit: CanvasKit, props: CkObjectTyping["skLine"]["props"]) {
    this.canvasKit = canvasKit;
    this.props = props;

    this.defaultPaint = new this.canvasKit.SkPaint();
    this.defaultPaint.setStyle(this.canvasKit.PaintStyle.Fill);
    this.defaultPaint.setAntiAlias(true);
  }

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error("BUG. line element deleted.");
    }
    if (parent && isCkCanvas(parent)) {
      // TODO we can be smart and only recreate the paint object if the paint props have changed.
      this.renderPaint?.delete();
      this.renderPaint = toSkPaint(this.canvasKit, this.props.paint);
      parent.skObject?.drawLine(
        this.props.x1,
        this.props.y1,
        this.props.x2,
        this.props.y2,
        this.renderPaint ?? this.defaultPaint
      );
    }
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

export const createCkLine: CkElementCreator<"skLine"> = (
  type,
  props,
  canvasKit
) => new CkLine(canvasKit, props);
