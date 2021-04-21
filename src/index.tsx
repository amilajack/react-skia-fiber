import type { CanvasKit, FontManager } from "canvaskit-wasm";
// import CanvasKitInit from "canvaskit-wasm";
import CanvasKitInit from "canvaskit-wasm/bin/profiling/canvaskit";
import type { FunctionComponent, ReactNode } from "react";
import React from "react";

const canvasKitPromise: Promise<CanvasKit> = CanvasKitInit({
  locateFile: (file: string) =>
    `https://unpkg.com/canvaskit-wasm@0.25.1/bin/${process.env.NODE_ENV === 'development' ? 'profiling/' : ''}` + file,
});
export let canvasKit: CanvasKit | undefined;

let CanvasKitContext: React.Context<CanvasKit>;
export let useCanvasKit: () => CanvasKit;
export let CanvasKitProvider: FunctionComponent;

let FontManagerContext: React.Context<FontManager>;
export let useFontManager: () => FontManager;
export let FontManagerProvider: FunctionComponent<{
  fontData: ArrayBuffer | ArrayBuffer[] | undefined;
  children?: ReactNode;
}>;

export { render, store } from "./renderer";
export { useFrame } from "./loop";

export async function init() {
  canvasKit = await canvasKitPromise;
  // const copy to make the TS compiler happy when we pass it down to a lambda
  const ck = canvasKit;

  CanvasKitContext = React.createContext(ck);
  useCanvasKit = () => React.useContext(CanvasKitContext);
  CanvasKitProvider = ({ children }) => (
    <CanvasKitContext.Provider value={ck}>children</CanvasKitContext.Provider>
  );

  FontManagerContext = React.createContext(ck.FontMgr.RefDefault());
  useFontManager = () => React.useContext(FontManagerContext);
  FontManagerProvider = (props: {
    fontData: ArrayBuffer | ArrayBuffer[] | undefined;
    children?: ReactNode;
  }) => {
    return (
      <FontManagerContext.Provider
        value={
          props.fontData
            ? ck.FontMgr.FromData(props.fontData)
            : ck.FontMgr.RefDefault()
        }
      >
        {props.children}
      </FontManagerContext.Provider>
    );
  };
}
