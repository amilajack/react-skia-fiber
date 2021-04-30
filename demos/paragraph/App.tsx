import React, { useRef, useEffect, useState } from "react";
import { FontManagerProvider, useFontManager, useFrame,SkLine,
  SkParagraph,
  SkText,
  SkCanvas, } from "../../src";

const paragraphText =
  "The quick brown fox 🦊 ate a zesty hamburgerfonts 🍔.\nThe 👩‍👩‍👧‍👧 laughed.";

const X = 100;
const Y = 200;

function App({ x = 0, y = 0 }: { x: number; y: number }) {
  const paragraphRef = React.useRef<SkParagraph>();
  const lineRef = useRef<SkLine>();
  const textRef = useRef<SkText>();
  const fontMgr = useFontManager();

  const seed = Math.random();

  const calcWrapTo = (time: number): number =>
    350 + 150 * seed * Math.sin((seed * time) / 200);

  useEffect(() => {
    paragraphRef.current!.fontManager = fontMgr;
    paragraphRef.current!.build();
  }, [fontMgr]);

  useFrame(() => {
    const wrap = calcWrapTo(performance.now());
    lineRef.current!.x1 = wrap + x;
    lineRef.current!.x2 = wrap + x;
    paragraphRef.current!.width = wrap;
    paragraphRef.current!.dirtyLayout = true;

    const posA = paragraphRef.current!.object?.getGlyphPositionAtCoordinate(
      X,
      Y
    );
    let glyph;
    if (posA) {
      const cp = paragraphText.codePointAt(posA.pos);
      if (cp) {
        glyph = String.fromCodePoint(cp);
      }
    }
    textRef.current!.text = glyph ?? "none";
  });

  return (
    <>
      <skLine ref={lineRef} x1={x} y1={y} x2={x} y2={y + 400} />
      <skParagraph
        ref={paragraphRef}
        text={paragraphText}
        x={x}
        y={y}
        width={500}
      />
      <skText ref={textRef} y={y + 450} x={x} />
      <skRrect x={x} y={y} />
    </>
  );
}

export default function StressTest() {
  const canvasRef = useRef<SkCanvas>();
  const [font, setFont] = useState<ArrayBuffer[]>()

  const elms = new Array(60);
  for (let i = 0; i < elms.length; i++) {
    elms[i] = i;
  }

  useEffect(() => {
    Promise.all([
      fetch('https://storage.googleapis.com/skia-cdn/google-web-fonts/Roboto-Regular.ttf').then(res => res.arrayBuffer()),
      fetch('https://storage.googleapis.com/skia-cdn/misc/NotoColorEmoji.ttf').then(res => res.arrayBuffer())
    ]).then(font => {
      setFont(font)
    })
  }, [])

  useFrame(() => {
    const time = performance.now();
    canvasRef.current?.object?.translate(
      10 * Math.cos(time / 500),
      10 * Math.sin(time / 500)
    );
  });

  return (
    <skCanvas ref={canvasRef} clear="#ABACAB">
      <FontManagerProvider fontData={font}>
        {elms.map((num) => (
          <App x={500 * (num % 5)} y={Math.floor(num / 5) * 500} key={num} />
        ))}
      </FontManagerProvider>
    </skCanvas>
  );
}
