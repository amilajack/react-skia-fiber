import React from "react";
import Reconciler from "react-reconciler";
import { isEqual } from "lodash";
import { SkChild, SkContainer, SkElement, SkElementProps } from "./types";
import { SkCanvas } from "./canvas";
import { SkParagraph } from "./paragraph";
import { canvasKit } from ".";
import { CanvasKit } from "canvaskit-wasm";
import { SkLine } from "./line";
import { SkRRect } from "./rrect";
import { SkText } from "./text";
import { SkSurface } from "./surface";
import { UseStore } from "zustand";
import { createStore, RootState, context, StoreProps } from "./store";
import { createLoop } from "./loop";
import { SkPath } from "./path";

let roots = new Map<Element, Root>();
export const { invalidate } = createLoop(roots);

type Instance = SkElement;
export type InstanceProps = {
  [key: string]: unknown;
};

export enum RenderModes {
  legacy = 0,
  blocking = 1,
  concurrent = 2,
}

const EMPTY = {};

const FILTER = ["children", "key", "ref"];

function appendChild(parentInstance: SkContainer, child: SkChild) {
  parentInstance.children.push(child);
  invalidate();
}

function removeChild(parentInstance: SkContainer, child: SkChild) {
  child.delete();
  parentInstance.children.splice(parentInstance.children.indexOf(child), 1);
  invalidate();
}

function insertBefore(
  parentInstance: SkContainer,
  child: SkChild,
  beforeChild: SkChild
) {
  const index = parentInstance.children.indexOf(beforeChild);
  const { children } = parentInstance;
  parentInstance.children = [
    ...children.slice(0, index),
    child,
    ...children.slice(index),
  ];
  invalidate();
}

const reconciler = Reconciler({
  /**
   * This function is used by the reconciler in order to calculate current time for prioritising work.
   */
  now: Date.now,
  supportsMutation: true,
  supportsPersistence: false,
  supportsHydration: false,
  isPrimaryRenderer: false,

  appendChild,
  appendInitialChild: appendChild,
  removeChild,
  insertBefore,

  /**
   * Create instance is called on all host nodes except the leaf text nodes. So we should return the correct view
   * element for each host type here. We are also supposed to take care of the props sent to the host element. For
   * example: setting up onClickListeners or setting up styling etc.
   *
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props  Contains the props passed to the host react element.
   * @param rootContainerInstance Root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   * @param internalInstanceHandle The fiber node for the text instance. This manages work for this instance.
   */
  createInstance(
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle
  ) {
    // @TODO: initialize with props without having to call applyProps
    const instance = (() => {
      switch (type) {
        case "skCanvas":
          return new SkCanvas(canvasKit as CanvasKit);
        case "skParagraph":
          return new SkParagraph(canvasKit as CanvasKit);
        case "skLine":
          return new SkLine(canvasKit as CanvasKit);
        case "skText":
          return new SkText(canvasKit as CanvasKit);
        case "skRrect":
          return new SkRRect(canvasKit as CanvasKit);
        case "skPath":
          return new SkPath(canvasKit as CanvasKit);
        default:
          throw "invalid instance";
      }
    })();
    applyProps(instance, props, {});
    // instance.root = rootContainerInstance;
    return instance;
  },
  createTextInstance() {},
  appendChildToContainer: (parentInstance: SkContainer, child: SkChild) => {
    appendChild(parentInstance, child);
  },
  insertInContainerBefore(
    parentInstance: Instance,
    child: Instance,
    beforeChild: Instance
  ) {
    insertBefore(parentInstance, child, beforeChild);
  },
  removeChildFromContainer: (parentInstance: SkContainer, child: SkChild) => {
    removeChild(parentInstance, child);
  },
  commitMount() {},
  commitUpdate(
    instance: Instance,
    updatePayload: any,
    type: string,
    oldProps: InstanceProps,
    newProps: InstanceProps,
    fiber: Reconciler.Fiber
  ) {
    applyProps(instance, newProps, oldProps);
  },
  /**
   * In case of react native renderer, this function does nothing but return false.
   *
   * In case of react-dom, this adds default dom properties such as event listeners, etc.
   * For implementing auto focus for certain input elements (autofocus can happen only
   * after render is done), react-dom sends return type as true. This results in commitMount
   * method for this element to be called. The commitMount will be called only if an element
   * returns true in finalizeInitialChildren and after the all elements of the tree has been
   * rendered (even after resetAfterCommit).
   *
   * Triggers commitMount
   *
   * @param parentInstance The instance is the dom element after appendInitialChild.
   * @param type This contains the type of fiber i.e, ‘div’, ‘span’, ‘p’, ‘input’ etc.
   * @param props Contains the props passed to the host react element.
   * @param rootContainerInstance root dom node you specify while calling render. This is most commonly <div id="root"></div>
   * @param hostContext contains the context from the parent node enclosing this node. This is the return value from getChildHostContext of the parent node.
   */
  finalizeInitialChildren() {
    return false;
  },
  shouldSetTextContent() {
    return false;
  },
  getRootHostContext(rootContainer: SkElement) {
    return EMPTY;
  },
  getChildHostContext(parentHostContext: any) {
    return EMPTY;
  },
  scheduleTimeout() {},
  cancelTimeout() {},
  noTimeout() {},
  queueMicrotask() {},
  /**
   * This function gets executed after the inmemory tree has been attached to the root dom element. Here we can do any
   * post attach operations that needs to be done. For example: react-dom re-enabled events which were temporarily
   * disabled in prepareForCommit and refocuses elements, etc.
   *
   * @param containerInfo root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  resetAfterCommit(containerInfo) {},
  getPublicInstance(instance: SkElement): SkElement {
    return instance;
  },
  /**
   * This function is called when we have made a in-memory render tree of all the views (Remember we are yet to attach
   * it the the actual root dom node). Here we can do any preparation that needs to be done on the rootContainer before
   * attaching the in memory render tree. For example: In the case of react-dom, it keeps track of all the currently
   * focused elements, disabled events temporarily, etc.
   *
   * @param containerInfo root dom node you specify while calling render. This is most commonly <div id="root"></div>
   */
  prepareForCommit() {
    return null;
  },
  prepareUpdate(instance, type, oldProps, newProps) {
    return newProps;
  },
  preparePortalMount(...args: any) {
    // noop
  },
  clearContainer() {
    return false;
  },
});

reconciler.injectIntoDevTools({
  bundleType: process.env.NODE_ENV === "production" ? 0 : 1,
  version: "0.0.1",
  rendererPackageName: "react-skia-fiber",
});

export const store = {};

export type Root = { fiber: Reconciler.FiberRoot; store: UseStore<RootState> };

export type LocalState = {
  root: UseStore<RootState>;
  objects: SkElement[];
  instance?: boolean;
  memoizedProps: {
    [key: string]: any;
  };
};

export function unmountComponentAtNode<TElement extends Element>(
  canvas: TElement,
  callback?: (canvas: TElement) => void
) {
  const root = roots.get(canvas);
  const fiber = root?.fiber;
  if (fiber) {
    const state = root?.store.getState();
    reconciler.updateContainer(null, fiber, null, () => {
      if (state) {
        setTimeout(() => {
          roots.delete(canvas);
          if (callback) callback(canvas);
        }, 500);
      }
    });
  }
}

function applyProps(
  elm: SkChild,
  newProps: SkElementProps<SkElement>,
  oldProps: SkElementProps<SkElement> = {}
) {
  const isDirty = !isEqual(newProps, oldProps);
  elm.dirty = isDirty;
  elm.dirtyLayout = false;
  elm.dirtyPaint = false;
  if (!isDirty) return;

  const filteredProps: { [key: string]: any } = {};
  Object.entries(newProps).forEach(([key, entry]) => {
    // we don't want children, ref or key in the memoized props
    if (!FILTER.includes(key)) {
      filteredProps[key] = entry;
    }
  });
  for (const key in filteredProps) {
    elm[key] = filteredProps[key];
    if (
      !elm.dirtyLayout &&
      elm.layoutProperties?.has(key) &&
      newProps[key] !== oldProps[key]
    ) {
      elm.dirtyLayout = true;
    }
  }

  if (!isEqual(oldProps.style, newProps.style)) elm.dirtyPaint = true;

  return elm;
}

export interface RenderProps extends StoreProps {
  width?: number;
  height?: number;
  dpr?: 1 | 2;
  canvasKit: CanvasKit;
  renderMode?: RenderModes;
}

export function render(
  element: React.ReactNode,
  canvas: HTMLCanvasElement,
  { canvasKit, renderMode = RenderModes.blocking, ...props }: RenderProps
): UseStore<RootState> {
  // Allow size to take on container bounds initially

  let root = roots.get(canvas);
  let fiber = root?.fiber;
  let store = root?.store;

  if (!fiber) {
    // If no root has been found, make one

    // Create gl
    const surface = new SkSurface(canvasKit, canvas);
    store = createStore(canvasKit, surface, invalidate, props);
    // Create renderer
    fiber = reconciler.createContainer(surface, renderMode, false, null);
    // Map it
    roots.set(canvas, { fiber, store });
  }

  if (store && fiber) {
    reconciler.updateContainer(
      <Provider store={store} element={element} />,
      fiber,
      null,
      () => undefined
    );
    return store;
  } else {
    throw "Error creating root!";
  }
}

function Provider({
  store,
  element,
}: {
  store: UseStore<RootState>;
  element: React.ReactNode;
}) {
  React.useEffect(() => {
    const state = store.getState();
    // Flag the canvas active, rendering will now begin
    state.set((state) => ({ internal: { ...state.internal, active: true } }));
  }, []);
  return <context.Provider value={store}>{element}</context.Provider>;
}
