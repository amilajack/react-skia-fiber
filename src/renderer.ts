import Reconciler from "react-reconciler";
import {isEqual} from 'lodash'
import {
  CkContainer,
  CkElement,
  CkElementProps,
} from "./types";
import CkCanvas from "./canvas";
import CkParagraph from "./paragraph";
import { canvasKit } from '.'
import { CanvasKit } from "canvaskit-wasm";
import CkLine from "./line";
import CkText from "./text";

type Instance = CkElement;
export type InstanceProps = {
  [key: string]: unknown
}

enum RenderModes {
  legacy = 0,
  blocking = 1,
  concurrent = 2,
}

export type SkObjectRef<T extends SkObject<any> | undefined | never> = T;

const EMPTY = {};

const FILTER = ['children', 'key', 'ref']

function appendChild(parentInstance: CkContainer, child: CkElement) {
  parentInstance.children.push(child);
}

function removeChild(parentInstance: CkContainer, child: CkElement) {
  parentInstance.children.push(child);
}

function insertBefore(parentInstance: CkContainer, child: CkElement) {
  parentInstance.children.unshift(child)
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
  createInstance (
    type,
    props,
    rootContainerInstance,
    hostContext,
    internalInstanceHandle) {
      const instance = (() => {
        switch (type) {
          case "skCanvas": return new CkCanvas(canvasKit as CanvasKit, props)
          case "skParagraph": return new CkParagraph(canvasKit as CanvasKit, props)
          case "skLine": return new CkLine(canvasKit as CanvasKit, props)
          case "skText": return new CkText(canvasKit as CanvasKit, props)
          default: throw 'invalid instance'
        }
      })()
      applyProps(instance, props, {})
      return instance;
  },
  createTextInstance() {},
  appendChildToContainer: (parentInstance: CkContainer, child: CkElement) => {
    appendChild(parentInstance, child)
  },
  removeChildFromContainer: (parentInstance: CkContainer, child: CkElement) => {
    removeChild(parentInstance, child)
  },
  commitMount() {},
  commitUpdate(
    instance: Instance,
    updatePayload: any,
    type: string,
    oldProps: InstanceProps,
    newProps: InstanceProps,
    fiber: Reconciler.Fiber,
  ) {
      applyProps(instance, newProps, oldProps, true)
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
    return true;
  },
  shouldSetTextContent() {
    return false;
  },
  getRootHostContext(rootContainer: UseStore<RootState> | CkElement) {
    return EMPTY
  },
  getChildHostContext(parentHostContext: any) {
    return EMPTY
  },
  scheduleTimeout(){},
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
  resetAfterCommit (containerInfo) {
    // TODO instead of re-rendering everything, only rerender dirty nodes?
    containerInfo.children.forEach(child => child.render(containerInfo))
  },
  getPublicInstance(
    instance: CkElement<any> | CkElement<"skText">
  ): SkObjectRef<any> {
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
  prepareUpdate() {
    return EMPTY;
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

export type Root = { fiber: Reconciler.FiberRoot; store: UseStore<RootState> }

export type RootState = {
  // mouse: THREE.Vector2
  // clock: THREE.Clock

  // frameloop: 'always' | 'demand' | 'never'
  // performance: Performance

  // size: Size
  // viewport:

  set: SetState<RootState>
  get: GetState<RootState>
  invalidate: () => void
  advance: (timestamp: number, runGlobalEffects?: boolean) => void
  setSize: (width: number, height: number) => void
  // setDpr: (dpr: Dpr) => void

  // events: EventManager<any>
  // internal: InternalState
}

export type LocalState = {
  root: UseStore<RootState>
  objects: CkElement[]
  instance?: boolean
  // handlers?: EventHandlers
  memoizedProps: {
    [key: string]: any
  }
}

function applyProps(elm: CkElement, newProps: CkElementProps, oldProps: CkElementProps = {}, accumulative = false) {
  if (isEqual(newProps, oldProps)) {
    elm.dirty = false;
  } else {
    const newMemoizedProps: { [key: string]: any } = {}
    Object.entries(newProps).forEach(([key, entry]) => {
      // we don't want children, ref or key in the memoized props
      if (!FILTER.includes(key)) {
        newMemoizedProps[key] = entry
      }
    })
    for (const key in newMemoizedProps) {
      elm[key] = newMemoizedProps[key];
      elm.dirty = true;
    }
    invalidateElement(elm)
  }
  return elm;
}

function invalidateElement(elm: CkElement) {
  elm.dirty = true;
}

export function render(
  element: React.ReactNode,
  canvas: HTMLCanvasElement,
  renderCallback?: () => void
) {
  if (canvasKit === undefined) {
    throw new Error("Not initialized");
  }

  const skSurface = canvasKit.MakeCanvasSurface(canvas);
  const ckSurfaceElement: CkElementContainer<"skSurface"> = {
    canvasKit,
    type: "skSurface",
    // @ts-ignore
    props: { width: canvas.width, height: canvas.height, renderCallback },
    skObjectType: "SkSurface",
    skObject: skSurface,
    children: [],
    render() {
      this.children.forEach((child) => child.render(ckSurfaceElement));
    },
  };

  store.root = ckSurfaceElement;

  const container = reconciler.createContainer(
    ckSurfaceElement,
    RenderModes.blocking,
    false,
    null
  );

  return new Promise<void>((resolve) => {
    reconciler.updateContainer(element, container, null, () => resolve());
  });
}
