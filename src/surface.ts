import { CanvasKit, Surface } from "canvaskit-wasm";
import CkCanvas from "./canvas";
import { CkContainer } from "./types";

export interface CkSurfaceProps {
  width?: number;
  height?: number;
  children: CkCanvas[];
}

export default class CkSurface implements CkContainer<CkCanvas, CkSurface> {
  readonly type = "skSurface";
  canvasKit: CanvasKit;
  children: CkCanvas[] = [];
  skObject: Surface;

  constructor(canvasKit: CanvasKit, canvas: HTMLCanvasElement) {
    this.canvasKit = canvasKit;
    this.skObject = canvasKit.MakeCanvasSurface(canvas)!;
  }

  render() {
    this.children.forEach((child) => child.render(this.skObject));
  }

  delete() {
    this.skObject.delete();
    this.skObject.dispose();
  }
}
