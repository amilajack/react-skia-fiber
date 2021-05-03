import * as React from "react";
import { StateSelector, EqualityChecker } from "zustand";
import { context, RootState, RenderCallback, RenderSequence } from "./store";

export function useSkia<T = RootState>(
  selector: StateSelector<RootState, T> = (state) => (state as unknown) as T,
  equalityFn?: EqualityChecker<T>
) {
  const useStore = React.useContext(context);
  if (!useStore)
    throw `R3F hooks can only be used within the Canvas component!`;
  return useStore(selector, equalityFn);
}

export function useFrame(
  callback: RenderCallback,
  opts: { renderPriority: number; sequence: RenderSequence } = {
    renderPriority: 0,
    sequence: "before",
  }
): null {
  const { subscribe } = React.useContext(context).getState().internal;
  const { renderPriority, sequence } = opts;

  // Update ref
  const ref = React.useRef<RenderCallback>(callback);
  React.useLayoutEffect(() => void (ref.current = callback), [callback]);
  // Subscribe/unsub
  React.useEffect(() => {
    const unsubscribe = subscribe(ref, renderPriority, sequence);
    return () => unsubscribe();
  }, [renderPriority, subscribe]);
  return null;
}
