import type { CanvasKit, SkFontManager } from "canvaskit-oc";
import { init as canvasKitInit } from "canvaskit-oc";
import type { FunctionComponent, ReactNode } from "react";
import React from "react";

const canvasKitPromise: Promise<CanvasKit> = canvasKitInit();
export let canvasKit: CanvasKit | undefined;

let CanvasKitContext: React.Context<CanvasKit>;
export let useCanvasKit: () => CanvasKit;
export let CanvasKitProvider: FunctionComponent;

let FontManagerContext: React.Context<SkFontManager>;
export let useFontManager: () => SkFontManager;
export let FontManagerProvider: FunctionComponent<{
  fontData: ArrayBuffer | ArrayBuffer[] | undefined;
  children?: ReactNode;
}>;

export {render, store} from './renderer'
export {useFrame} from './loop'

export async function init() {
  canvasKit = await canvasKitPromise;
  // const copy to make the TS compiler happy when we pass it down to a lambda
  const ck = canvasKit;

  CanvasKitContext = React.createContext(ck);
  useCanvasKit = () => React.useContext(CanvasKitContext);
  CanvasKitProvider = ({ children }) => (
    <CanvasKitContext.Provider value={ck}>children</CanvasKitContext.Provider>
  );

  FontManagerContext = React.createContext(ck.SkFontMgr.RefDefault());
  useFontManager = () => React.useContext(FontManagerContext);
  FontManagerProvider = (props: {
    fontData: ArrayBuffer | ArrayBuffer[] | undefined;
    children?: ReactNode;
  }) => {
    return (
      <FontManagerContext.Provider
        value={
          props.fontData
            ? ck.SkFontMgr.FromData(props.fontData)
            : ck.SkFontMgr.RefDefault()
        }
      >
        {props.children}
      </FontManagerContext.Provider>
    );
  };
}
