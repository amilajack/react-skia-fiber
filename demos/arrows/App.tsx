import React, { useEffect, useState } from "react";
import { invalidate } from "../../src";

export default function App() {
  const [color, setColor] = useState("red");

  useEffect(() => {
    let colors = ["red", "green", "blue"];
    let i = 0;
    let interval = setInterval(() => {
      i++;
      setColor(colors[i % 3]);
      invalidate();
    }, 1_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <skCanvas clear="#ABACAB">
      <skRrect x={100} y={100} style={{ color: "#FFFFFF" }} />
      <skRrect x={200} y={200} style={{ color }} />
      <skRrect
        x={300}
        y={300}
        style={{ color: new Float32Array([0, 255, 0]) }}
      />
      <skRrect x={400} y={400} style={{ color: [255, 0, 0] }} />
      <skPath />
    </skCanvas>
  );
}
