import React, { useEffect, useState } from "react";
import {SkParagraph} from "../../src";

export default function App() {
  const paragraphRef = React.useRef<SkParagraph>();
  const [color, setColor] = useState('red')

  useEffect(() => {
    let colors = ['red', 'green', 'blue'];
    let i = 0;
    let interval = setInterval(() => {
      i++;
      setColor(colors[i % 3]);
    }, 1_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <skCanvas clear="#ABACAB">
      <skParagraph x={100} y={100} width={500} ref={paragraphRef} text={color} />
      <skText x={100} y={100} text={color} />
    </skCanvas>
  )
}
