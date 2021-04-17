import type { SkParagraph } from "canvaskit-oc";
import React from "react";
import { SkObjectRef, store } from "../";
import { useFontManager, useFrame } from "..";
import { PaintStyle, TextAlignEnum } from "../types";

const fontPaint = { style: PaintStyle.Fill, antiAlias: true };

const X = 250;
const Y = 250;
const paragraphText =
  "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed.";

export default function App() {
  const skParagraphRef = React.useRef<SkObjectRef<SkParagraph>>(null);
  const textRef = React.useRef<SkObjectRef<never>>(null);
  const fontManager = useFontManager();

  const calcWrapTo = (time: number): number =>
    350 + 150 * Math.sin(time / 2000);
  const [wrapTo, setWrapTo] = React.useState(calcWrapTo(0));

  useFrame((time) => {
    if (skParagraphRef.current) {
      skParagraphRef.current.layout = calcWrapTo(time)
      store.root.render()
    }
  });

  const posA = skParagraphRef.current?.getGlyphPositionAtCoordinate(X, Y);
  let glyph;
  if (posA) {
    const cp = paragraphText.codePointAt(posA.pos);
    if (cp) {
      glyph = String.fromCodePoint(cp);
    }
  }

  return (
    <skCanvas clear="#FFFFFF">
      <skParagraph
        fontManager={fontManager}
        ref={skParagraphRef}
        textStyle={{
          color: "#000000",
          // Noto Mono is the default canvaskit font, we use it as a fallback
          fontFamilies: ["Noto Mono", "Roboto", "Noto Color Emoji"],
          fontSize: 50,
        }}
        textAlign={TextAlignEnum.Left}
        maxLines={7}
        ellipsis="..."
        layout={wrapTo}
      >
        {paragraphText}
      </skParagraph>
      <skLine x1={wrapTo} y1={0} x2={wrapTo} y2={400} paint={fontPaint} />
      <skText ref={textRef} x={5} y={450} paint={fontPaint}>{`At (${X.toFixed(
        2
      )}, ${Y.toFixed(2)}) glyph is '${glyph}'`}</skText>
    </skCanvas>
  );
}
