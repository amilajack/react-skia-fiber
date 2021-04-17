import type { CanvasKit, SkCanvas, SkPaint, SkSurface } from "canvaskit-oc";
import type { ReactElement } from "react";
import type { CkCanvasProps } from "./canvas";
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

export interface CkSurfaceProps extends CkElementProps<SkSurface> {
  width: number;
  height: number;
  dx?: number;
  dy?: number;
  paint?: Paint;

  children?: ReactElement<CkCanvasProps> | ReactElement<CkCanvasProps>[];
}

export class CkSurface implements CkElementContainer<"skSurface"> {
  readonly canvasKit: CanvasKit;
  readonly props: CkObjectTyping["skSurface"]["props"];
  skObject?: CkObjectTyping["skSurface"]["type"];
  readonly skObjectType: CkObjectTyping["skSurface"]["name"] = "SkSurface";
  readonly type: "skSurface" = "skSurface";
  children: CkElementContainer<"skCanvas">[] = [];

  readonly defaultPaint: SkPaint;
  private renderPaint?: SkPaint;
  deleted = false;

  constructor(canvasKit: CanvasKit, props: CkObjectTyping["skSurface"]["props"]) {
    this.canvasKit = canvasKit;
    this.props = props;
    this.defaultPaint = new this.canvasKit.SkPaint();
  }

  render(parent: CkElementContainer<any>) {
    if (this.deleted) {
      throw new Error("BUG. surface element deleted.");
    }

    if (parent.skObject && isCkCanvas(parent)) {
      if (this.skObject === undefined) {
        const { width, height } = this.props;
        this.skObject = this.canvasKit.MakeSurface(width, height);
      }
    } else {
      throw new Error("Expected an initialized canvas as parent of surface");
    }

    this.children.forEach((child) => child.render(this));
    this.drawSelf(parent.skObject, this.skObject);
    this.deleted = false;
  }

  private drawSelf(parent: SkCanvas, skSurface: SkSurface) {
    const skImage = skSurface.makeImageSnapshot();
    const { dx, dy, paint } = this.props;
    // TODO we can be smart and only recreate the paint object if the paint props have changed.
    this.renderPaint?.delete();
    this.renderPaint = toSkPaint(this.canvasKit, paint);
    parent.drawImage(
      skImage,
      dx ?? 0,
      dy ?? 0,
      this.renderPaint ?? this.defaultPaint
    );
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    this.defaultPaint.delete();
    this.renderPaint?.delete();
    this.renderPaint = undefined;
    this.skObject?.delete();
    this.skObject = undefined;
  }
}

export const createCkSurface: CkElementCreator<"skSurface"> = (
  type,
  props,
  canvasKit
): CkElementContainer<"skSurface"> => {
  return new CkSurface(canvasKit, props);
};

export function isCkSurface(ckElement: CkElement<any>): ckElement is CkSurface {
  return ckElement.type === "skSurface";
}
