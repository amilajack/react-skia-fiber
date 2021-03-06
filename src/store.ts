import { CanvasKit } from "canvaskit-wasm";
import { createContext } from "react";
import create, { UseStore, SetState, GetState } from "zustand";
import { SkSurface } from "./surface";
import { Clock } from "./loop";

export type RenderSequence = "before" | "after";

export type Subscription = {
  ref: React.MutableRefObject<RenderCallback>;
  priority: number;
  sequence: RenderSequence;
};

export type InternalState = {
  active: boolean;
  priority: number;
  frames: number;

  subscribers: Subscription[];

  subscribe: (
    callback: React.MutableRefObject<RenderCallback>,
    priority?: number,
    sequence?: RenderSequence
  ) => () => void;
};

export type RootState = {
  canvasKit: CanvasKit;
  set: SetState<RootState>;
  get: GetState<RootState>;
  internal: InternalState;
  surface: SkSurface;
  frameloop: "always" | "demand" | "never";
  clock: Clock;
};

export type StoreProps = {
  frameloop?: "always" | "demand" | "never";
  performance?: Partial<Omit<Performance, "regress">>;
  dpr?: 1 | 2;
  clock?: Clock;
};

export const context = createContext<UseStore<RootState>>(null!);

export function createStore(
  canvasKit: CanvasKit,
  surface: SkSurface,
  invalidate: (state?: RootState) => void,
  props: Partial<StoreProps>
): UseStore<RootState> {
  const {
    frameloop = "always",
    dpr = 1,
    performance,
    clock = new Clock(),
  } = props;

  const rootState = create<RootState>((set, get) => {
    return {
      invalidate: () => invalidate(get()),
      set,
      get,
      dpr,
      canvasKit,
      surface,
      frameloop,
      clock,
      internal: {
        subscribers: [],
        frames: 0,
        active: false,
        priority: 0,
        subscribe: (
          ref: React.MutableRefObject<RenderCallback>,
          priority = 0,
          sequence = "before"
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
              subscribers: [
                ...internal.subscribers,
                { ref, priority, sequence },
              ].sort((a, b) => a.priority - b.priority),
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
