import { Canvas, CanvasKit } from "canvaskit-wasm";
import { RefObject } from "react";
import { CkCanvasProps } from "./canvas";
import { CkLineProps } from "./line";
import { CkParagraphProps } from "./paragraph";
import { CkSurfaceProps } from "./surface";
import { CkTextProps } from "./text";

export type CkElementType = 'skParagraph' | 'skSurface' | 'skText' | 'skCanvas';
export type CkElementName = 'SkParagraph' | 'SkSurface' | 'SkText' | 'SkCanvas';

export interface CkElement {
  readonly type: CkElementType;
  readonly name: CkElementName;
  readonly skObjectType: CkElementType;
  readonly canvasKit: CanvasKit;
  ref?: RefObject<CkElement>;
  render: (parent: Canvas) => void;
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
      skText: CkTextProps;
      skParagraph: CkParagraphProps;
    }
  }
}
