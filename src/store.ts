import { CanvasKit } from "canvaskit-wasm";
import { createContext } from "react";
import create, { UseStore, SetState, GetState } from "zustand";
import CkSurface from "./surface";
import { Clock } from "./loop";

export type Subscription = {
  ref: React.MutableRefObject<RenderCallback>;
  priority: number;
};

export type InternalState = {
  active: boolean;
  priority: number;
  frames: number;

  subscribers: Subscription[];

  subscribe: (
    callback: React.MutableRefObject<RenderCallback>,
    priority?: number
  ) => () => void;
};

export type RootState = {
  canvasKit: CanvasKit;
  set: SetState<RootState>;
  get: GetState<RootState>;
  internal: InternalState;
  surface: CkSurface;
  frameloop: "always" | "demand" | "never";
  clock: Clock;
};

export const context = createContext<UseStore<RootState>>(null!);

export function createStore(
  canvasKit: CanvasKit,
  surface: CkSurface,
  invalidate: (state?: RootState) => void
) {
  const rootState = create<RootState>((set, get) => {
    return {
      invalidate: () => invalidate(get()),
      set,
      get,
      dpr: 2,
      canvasKit,
      surface,
      frameloop: "always",
      clock: new Clock(),
      internal: {
        subscribers: [],
        frames: 0,
        active: true,
        priority: 0,
        subscribe: (
          ref: React.MutableRefObject<RenderCallback>,
          priority = 0
        ) => {
          set(({ internal }) => ({
            internal: {
              ...internal,
              // If this subscription was given a priority, it takes rendering into its own hands
              // For that reason we switch off automatic rendering and increase the manual flag
              // As long as this flag is positive (there could be multiple render subscription)
              // ..there can be no internal rendering at all
              priority: internal.priority + (priority ? 1 : 0),
              // Register subscriber and sort layers from lowest to highest, meaning,
              // highest priority renders last (on top of the other frames)
              subscribers: [...internal.subscribers, { ref, priority }].sort(
                (a, b) => a.priority - b.priority
              ),
            },
          }));
          return () => {
            set(({ internal }) => ({
              internal: {
                ...internal,
                // Decrease manual flag if this subscription had a priority
                priority: internal.priority - (priority ? 1 : 0),
                // Remove subscriber from list
                subscribers: internal.subscribers.filter((s) => s.ref !== ref),
              },
            }));
          };
        },
      },
    };
  });

  rootState.subscribe((state) => invalidate(state));

  return rootState;
}

export type RenderCallback = (state: RootState, delta: number) => void;
