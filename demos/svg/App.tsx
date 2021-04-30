import React, { useEffect, useState } from "react";
import { useCanvasKit } from "../../src";
import CkParagraph from "../../src/paragraph";
import CkPath from "../../src/path";

export default function App() {
  const pathRef = React.useRef<CkPath>();
  const canvasKit = useCanvasKit();

  useEffect(() => {
    fetch("https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg").then(res => res.text()).then(text => {
      const path = canvasKit.Path.MakeFromSVGString(text)!;
      pathRef.current!.path = path;
    })
  }, []);

  return (
    <skCanvas clear="#ABACAB">
      <skPath ref={pathRef} />
    </skCanvas>
  )
}
