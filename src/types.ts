import { CanvasKit } from "canvaskit-oc";
import { RefObject } from "react";
import CkCanvas, { CkCanvasProps } from "./canvas";
import { CkLineProps } from "./line";
import CkParagraph from "./paragraph";
import { CkSurfaceProps } from "./surface";

export type CkElementType = 'skParagraph' | 'skSurface' | 'skText' | 'skCanvas';
export type CkElementName = 'SkParagraph' | 'SkSurface' | 'SkText' | 'SkCanvas';

export interface CkElement {
  readonly type: CkElementType;
  readonly name: CkElementName;
  readonly skObjectType: CkElementType;
  readonly canvasKit: CanvasKit;
  ref?: RefObject<CkElement>;
  render: (parent: CkContainer) => void;
  skObject?: any;
  children: CkElement[];
}

export interface CkContainer extends CkElement {
  children: CkElement[]
}

export type CkElementProps = {
  [key: string]: unknown;
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      skCanvas: CkCanvasProps;
      skSurface: CkSurfaceProps;
      skLine: CkLineProps;
      skParagraph: CkParagraph;
    }
  }
}
