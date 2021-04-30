import { CanvasKit, Surface } from "canvaskit-wasm";
import { SkCanvas } from "./canvas";
import { CkContainer } from "./types";

export interface SkSurfaceProps {
  width?: number;
  height?: number;
  children: SkCanvas[];
}

export class SkSurface implements CkContainer<SkCanvas, SkSurface> {
  readonly type = "skSurface";
  canvasKit: CanvasKit;
  children: SkCanvas[] = [];
  object: Surface;

  constructor(canvasKit: CanvasKit, canvas: HTMLCanvasElement) {
    this.canvasKit = canvasKit;
    this.object = canvasKit.MakeCanvasSurface(canvas)!;
  }

  render() {
    this.children.forEach((child) => child.render(this.object));
  }

  delete() {
    this.object.delete();
    this.object.dispose();
  }
}
