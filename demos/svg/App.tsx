import React, { useEffect } from "react";
import { useCanvasKit } from "../../src";
import { SkPath } from "../../src";

export default function App() {
  const pathRef = React.useRef<SkPath>();
  const canvasKit = useCanvasKit();

  useEffect(() => {
    fetch(
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg"
    )
      .then((res) => res.text())
      .then((text) => {
        const path = canvasKit.Path.MakeFromSVGString(text)!;
        pathRef.current!.path = path;
      });
  }, []);

  return (
    <skCanvas clear="#ABACAB">
      <skPath ref={pathRef} />
    </skCanvas>
  );
}
