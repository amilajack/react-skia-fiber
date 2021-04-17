import type { CanvasKit, SkCanvas } from "canvaskit-oc";
import type { ReactNode } from "react";
import { isCkSurface } from "./surface";
import { toSkColor } from "./mappings";
import {
  CkElement,
  CkElementContainer,
  CkElementCreator,
  CkElementProps,
  CkObjectTyping,
  Color,
} from "./types";

export interface CkCanvasProps extends CkElementProps<SkCanvas> {
  clear?: Color | string;
  rotate?: { degree: number; px?: number; py?: number };
  children?: ReactNode;
}

type CkCanvasChild = CkElement<"skSurface"> | CkElement<"skText">;

export class CkCanvas implements CkElementContainer<"skCanvas"> {
  readonly canvasKit: CanvasKit;
  readonly props: CkObjectTyping["skCanvas"]["props"];
  skObject?: CkObjectTyping["skCanvas"]["type"];
  readonly skObjectType: CkObjectTyping["skCanvas"]["name"] = "SkCanvas";
  readonly type: "skCanvas" = "skCanvas";
  children: CkCanvasChild[] = [];

  private deleted = false;

  constructor(canvasKit: CanvasKit, props: CkObjectTyping["skCanvas"]["props"]) {
    this.canvasKit = canvasKit;
    this.props = props;
  }

  render(parent: CkElementContainer<any>): void {
    if (this.deleted) {
      throw new Error("BUG. canvas element deleted.");
    }

    if (parent.skObject && isCkSurface(parent)) {
      if (this.skObject === undefined) {
        this.skObject = parent.skObject.getCanvas();
      }
    } else {
      throw new Error("Expected an initialized surface as parent of canvas");
    }

    this.skObject.save();
    this.drawSelf(this.skObject);
    this.children.forEach((child) => child.render(this));
    this.skObject.restore();
    this.skObject.flush();
  }

  private drawSelf(skCanvas: SkCanvas) {
    const skColor = toSkColor(this.canvasKit, this.props.clear);
    if (skColor) {
      skCanvas.clear(skColor);
    }

    if (this.props.rotate) {
      const { degree, px, py } = this.props.rotate;
      skCanvas.rotate(degree, px ?? 0, py ?? 0);
    }
  }

  delete() {
    if (this.deleted) {
      return;
    }
    this.deleted = true;
    // The canvas object is 1-to-1 linked to the parent surface object, so deleting it means we could never recreate it.
    // this.skObject?.delete()
    this.skObject = undefined;
  }
}

export function isCkCanvas(ckElement: CkElement<any>): ckElement is CkCanvas {
  return ckElement.type === "skCanvas";
}

export const createCkCanvas: CkElementCreator<"skCanvas"> = (
  type,
  props,
  canvasKit: CanvasKit
): CkElementContainer<"skCanvas"> => new CkCanvas(canvasKit, props);
