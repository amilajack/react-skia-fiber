import type { CanvasKit, SkCanvas, SkPaint, SkSurface } from "canvaskit-oc";
import type { ReactElement } from "react";
import type { CkCanvasProps } from "./canvas";
import { is } from "./is";
import { CkContainer, CkElement } from "./types";
export interface CkSurfaceProps extends CkElementProps<SkSurface> {
  width: number;
  height: number;
  dx?: number;
  dy?: number;
  paint?: Paint;

  children?: ReactElement<CkCanvasProps> | ReactElement<CkCanvasProps>[];
}

export class CkSurface implements CkContainer {
  readonly canvasKit: CanvasKit;
  readonly name = "SkSurface";
  readonly skObjectType = "SkSurface";
  readonly type = "skSurface";

  readonly defaultPaint: SkPaint;
  private renderPaint?: SkPaint;
  deleted = false;

  children = []

  constructor(
    canvasKit: CanvasKit,
  ) {
    this.canvasKit = canvasKit;
    this.defaultPaint = new this.canvasKit.SkPaint();
  }

  render(parent: CkElementContainer<any>) {
    if (this.deleted) {
      throw new Error("BUG. surface element deleted.");
    }

    if (parent.skObject && is.canvas(parent)) {
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
