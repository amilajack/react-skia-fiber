import type { CanvasKit, FontMgr } from "canvaskit-wasm";
import CanvasKitInit from "canvaskit-wasm";
// import CanvasKitInit from "canvaskit-wasm/bin/profiling/canvaskit";
import type { FunctionComponent, ReactNode } from "react";
import React from "react";

export let canvasKit: CanvasKit | undefined;

let CanvasKitContext: React.Context<CanvasKit>;
export let useCanvasKit: () => CanvasKit;
export let CanvasKitProvider: FunctionComponent;

let FontManagerContext: React.Context<FontMgr>;
export let useFontManager: () => FontMgr;
export let FontManagerProvider: FunctionComponent<{
  fontData: ArrayBuffer | ArrayBuffer[] | undefined;
  children?: ReactNode;
}>;

export { render, store, invalidate } from "./renderer";
export * from "./hooks";

export async function init(): Promise<CanvasKit> {
  const canvasKitPromise: Promise<CanvasKit> = CanvasKitInit({
    locateFile: (file: string) =>
      `https://unpkg.com/canvaskit-wasm@0.25.1/bin/${
        process.env.NODE_ENV === "development" ? "profiling/" : ""
      }` + file,
  });
  canvasKit = await canvasKitPromise;
  // const copy to make the TS compiler happy when we pass it down to a lambda
  const ck = canvasKit;

  CanvasKitContext = React.createContext(ck);
  useCanvasKit = () => React.useContext(CanvasKitContext);
  CanvasKitProvider = ({ children }) => (
    <CanvasKitContext.Provider value={ck}>{children}</CanvasKitContext.Provider>
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
            ? ck.FontMgr.FromData(props.fontData)!
            : ck.FontMgr.RefDefault()
        }
      >
        {props.children}
      </FontManagerContext.Provider>
    );
  };

  return canvasKit;
}
