import type { SkParagraph } from "canvaskit-oc";
import React, { useRef, useEffect } from "react";
import { SkObjectRef, store } from "../";
import { useFrame } from "..";
import CkLine from "../line";

const X = 250;
const Y = 250;
const paragraphText =
  "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed.";

export default function App() {
  const skParagraphRef = React.useRef<SkObjectRef<SkParagraph>>();
  const skLineRef = useRef<CkLine>();

  const calcWrapTo = (time: number): number =>
    350 + 150 * Math.sin(time / 2000);

  useFrame((time) => {
    if (skLineRef.current) {
      const wrap = calcWrapTo(time);
      skLineRef.current.x1 = wrap;
      skLineRef.current.x2 = wrap;
      // store?.root?.render()
    }
  });

  // const posA = skParagraphRef.current?.skObject.getGlyphPositionAtCoordinate(X, Y);
  // let glyph;
  // if (posA) {
  //   const cp = paragraphText.codePointAt(posA.pos);
  //   if (cp) {
  //     glyph = String.fromCodePoint(cp);
  //   }
  // }

  return (
    <skCanvas clear="#5a5a5a">
      {/* <skLine ref={skLineRef} x1={10} y1={0} x2={10} y2={400} /> */}
      {/* <skText x={100} y={100} text="asdfas" /> */}
      <skParagraph />
    </skCanvas>
  );
}
