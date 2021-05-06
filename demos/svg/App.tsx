import React, { useEffect } from "react";
import { SkPath } from "../../src";

export default function App() {
  const pathRef = React.useRef<SkPath>();

  useEffect(() => {
    fetch(
      "https://upload.wikimedia.org/wikipedia/commons/f/fd/Ghostscript_Tiger.svg"
    )
      .then((res) => res.text())
      .then((text) => {
        pathRef.current!.svg = text;
      });
  }, []);

  return (
    <skCanvas clear="#ABACAB">
      <skPath ref={pathRef} />
    </skCanvas>
  );
}
