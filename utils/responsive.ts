import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, Keyboard, Platform, ScrollView, TextInput, View, useWindowDimensions, type ImageSourcePropType, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

export const BASE_WIDTH = 393;
export const BASE_HEIGHT = 852;
export const MAX_CONTENT_WIDTH = 560;
// No bundled Nunito font is registered in this project. Use an available rounded
// system face instead of depending on different missing-font fallbacks per OS.
export const FRIENDLY_FONT = Platform.select({ android: "sans-serif-rounded", ios: "Avenir Next", default: "Arial" });
// Give web ImageBackground a box instead of inheriting the PNG's dimensions.
export const WEB_IMAGE_FILL = Platform.OS === "web" ? { width: "100%" as const, height: "100%" as const } : undefined;

// The tablet scene uses the entire available viewport. Width limits belong to
// individual forms/dialogs, never to the background or the whole application.
export function fitContentArea(width: number, height: number) {
  return { width, height };
}

// Keep the approved 800-point-wide composition proportional on wider tablets.
// Height bounds the growth on squarer/split viewports; small tablets retain
// their existing compact rules. These are logical points, independent of DPI.
export function getTabletContentScale(width: number, height: number) {
  return Math.max(1, Math.min(width / 800, height / 1050, 1.8));
}

export function createTabletMetrics(width: number, height: number, designContentHeight = 800) {
  const metrics = createSceneMetrics(width, height, designContentHeight);
  const contentScale = getTabletContentScale(width, height);
  const unit = Math.min(metrics.widthScale / contentScale, height / contentScale / designContentHeight, 1.35);
  return {
    ...metrics,
    contentScale,
    scale: (value: number) => round(value * unit * contentScale),
    moderateScale: (value: number, factor = 0.7) => round(value * (1 + (unit - 1) * factor) * contentScale),
  };
}

export function getTabletActivityLayout(width: number, height: number, bottomInset = 0) {
  const zoom = getTabletContentScale(width, height);
  const gutter = Math.max(16, Math.min(32 * zoom, width * 0.04));
  // The existing tray PNG has a 360:190 aspect ratio. Fit the whole tray and
  // its contents together, without stretching its frame or offsetting the art.
  const trayWidth = Math.min(width - gutter * 2,
    Math.min(340 * zoom, height * 0.28 * zoom, height * 0.34) * 360 / 190);
  const trayHeight = trayWidth * 190 / 360;
  const trayBottom = Math.max(gutter, bottomInset + 12 * zoom);
  return { gutter, trayWidth, trayHeight, trayBottom, trayLeft: (width - trayWidth) / 2,
    padding: 16 * zoom,
    itemScale: Math.min(1.65 * zoom, (trayHeight - 32 * zoom) / 165, (trayWidth - 40 * zoom) / 343) };
}

// Locate content baked into a cover image, including its vertical crop. Callers
// can keep a form clear of the artwork's heading at any viewport aspect ratio.
export function imagePointY(width: number, height: number, imageWidth: number, imageHeight: number, fraction: number) {
  const drawnHeight = imageHeight * Math.max(width / imageWidth, height / imageHeight);
  return (height - drawnHeight) / 2 + drawnHeight * fraction;
}

export function getTabletAuthLayout(width: number, height: number, kind: "login" | "cadastro", bottomInset = 0) {
  const zoom = getTabletContentScale(width, height);
  const scale = Math.max(width / 1086, height / 1448);
  const imageWidth = 1086 * scale;
  const imageHeight = 1448 * scale;
  const imageLeft = (width - imageWidth) / 2;
  const imageTop = (height - imageHeight) / 2;
  const unit = Math.min(1.25, Math.max(1.1, Math.min(width / zoom / 600, height / zoom / 900))) * zoom;
  const regionTop = imageTop + imageHeight * (kind === "login" ? 0.50 : 0.285);
  const regionBottom = Math.min(height - bottomInset - 16,
    imageTop + imageHeight * (kind === "login" ? 0.88 : 0.905));
  return { imageWidth, imageHeight, imageLeft, imageTop, regionTop, regionBottom, unit,
    formWidth: Math.min(640 * zoom, width - 48 * zoom, imageWidth * (kind === "login" ? 0.66 : 0.64)) };
}

export function getTabletConsultorioLayout(width: number, height: number, topInset = 0, bottomInset = 0) {
  const zoom = getTabletContentScale(width, height);
  const gutter = Math.max(16, Math.min(32 * zoom, width * 0.04));
  // Visible blue border of the original 1536x1024 rectangle.png canvas.
  // Limit the whole tray by its share of scene height as well as width.
  // Wider tablet proportions must not make it taller relative to the child.
  const trayWidth = Math.min(width - gutter * 2, height * 0.27 * 910 / 428, 880 * zoom);
  const trayHeight = trayWidth * 428 / 910;
  const trayBottom = Math.max(gutter, bottomInset + 16 * zoom);
  const artworkScale = trayWidth / 910;
  const titleTop = topInset + 16 * zoom;
  const titleHeight = Math.min(height * 0.22, 250 * zoom);
  const groundY = imagePointY(width, height, 854, 1842, 0.75);
  const dentistHeight = Math.max(180, Math.min(height * 0.72, width * 1.08,
    groundY - titleTop - titleHeight * 0.85));
  const dentistWidth = dentistHeight * 2 / 3;
  // Keep the crown aligned near the same scene height after cover cropping.
  const dentistTop = Math.min(groundY - dentistHeight, height * 0.20);
  return { gutter, trayWidth, trayHeight, trayBottom, trayLeft: (width - trayWidth) / 2,
    trayImageWidth: 1536 * artworkScale, trayImageHeight: 1024 * artworkScale,
    trayImageLeft: -310 * artworkScale, trayImageTop: -274 * artworkScale,
    dentistHeight, dentistWidth, dentistBottom: height - dentistTop - dentistHeight, dentistRight: -dentistWidth * 0.1 };
}

type ResponsiveMetrics = {
  width: number;
  height: number;
  widthScale: number;
  heightScale: number;
  sceneScale: number;
  scale: (value: number) => number;
  verticalScale: (value: number) => number;
  moderateScale: (value: number, factor?: number) => number;
};

const round = (value: number) => Math.round(value * 100) / 100;

export function createResponsiveMetrics(
  width: number,
  height: number
): ResponsiveMetrics {
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  const sceneScale = Math.min(widthScale, heightScale);

  const scale = (value: number) => round(value * widthScale);
  const verticalScale = (value: number) => round(value * heightScale);
  const moderateScale = (value: number, factor = 0.45) =>
    round(value + (scale(value) - value) * factor);

  return {
    width,
    height,
    widthScale,
    heightScale,
    sceneScale,
    scale,
    verticalScale,
    moderateScale,
  };
}

export function getScreenMetrics() {
  const { width, height } = Dimensions.get("screen");
  return createResponsiveMetrics(width, height);
}

export function getPhoneScreenMetrics(viewport: { width: number; height: number }) {
  return Platform.OS === "web"
    ? createResponsiveMetrics(viewport.width, viewport.height)
    : getScreenMetrics();
}

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return createResponsiveMetrics(width, height);
}

// The existing scenes occupy at most 800 design points vertically. Unlike the
// physical display height, this design extent is independent of Android bars.
export function createSceneMetrics(width: number, height: number, designContentHeight = 800) {
  const metrics = createResponsiveMetrics(width, height);
  const unit = Math.min(metrics.widthScale, height / designContentHeight);
  const scale = (value: number) => round(value * unit);
  return {
    ...metrics,
    scale,
    moderateScale: (value: number, factor = 0.45) =>
      round(value + (scale(value) - value) * factor),
  };
}

type Viewport = { width: number; height: number; topInset: number; bottomInset: number; backgroundHeight: number };
const ViewportContext = createContext<Viewport | null>(null);
const BackdropContext = createContext<React.Dispatch<React.SetStateAction<ImageSourcePropType | undefined>> | null>(null);

// Keep the artwork behind the status bar and reserve the other edges once.
export function TabletViewport({ children, backgroundSource }: { children: React.ReactNode; backgroundSource?: ImageSourcePropType }) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null);
  const [backdrop, setBackdrop] = useState<ImageSourcePropType | undefined>(undefined);
  const initialArea = {
    width: window.width - insets.left - insets.right,
    height: window.height,
  };
  const available = area ?? initialArea;
  const content = fitContentArea(available.width, available.height);
  const top = (available.height - content.height) / 2;
  const viewport = {
    ...content,
    topInset: Math.max(0, insets.top - top),
    bottomInset: insets.bottom,
    backgroundHeight: content.height,
  };

  return React.createElement(
    View,
    { style: { flex: 1, backgroundColor: "#D8F1FF", overflow: "hidden" } },
    (backdrop ?? backgroundSource) && React.createElement(Image, {
      source: backdrop ?? backgroundSource, pointerEvents: "none",
      style: { position: "absolute", width: "100%", height: "100%", resizeMode: "cover" },
    }),
    React.createElement(
      SafeAreaView,
      { style: { flex: 1 }, edges: ["left", "right"] },
      React.createElement(View,
      {
        style: { flex: 1, alignItems: "center", justifyContent: "center" },
        onLayout: ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
          // Keep the composition stable during adjustResize; only the visible
          // scroll viewport shrinks. A split-window width change still relayouts.
          if (layout.width <= 0 || layout.height <= 0) return;
          setVisibleHeight(layout.height);
          if (Keyboard.isVisible() && area && layout.width !== area.width) {
            setArea({ width: layout.width, height: Math.max(layout.height, Math.min(area.height, layout.height + (Keyboard.metrics()?.height ?? 0))) });
            return;
          }
          if (Keyboard.isVisible() || (TextInput.State.currentlyFocusedInput?.() && area?.width === layout.width && layout.height < area.height)) return;
          setArea((previous) => previous?.width === layout.width && previous.height === layout.height
            ? previous : { width: layout.width, height: layout.height });
        },
      },
      React.createElement(View, { style: { width: content.width, height: Math.min(content.height, visibleHeight ?? content.height) } },
        React.createElement(ViewportContext.Provider, { value: viewport },
          React.createElement(BackdropContext.Provider, { value: setBackdrop }, children)))
      )
    )
  );
}

export function useSceneBackdrop(source: ImageSourcePropType) {
  const setBackdrop = useContext(BackdropContext);
  useEffect(() => {
    let previous: ImageSourcePropType | undefined;
    setBackdrop?.((current) => { previous = current; return source; });
    return () => setBackdrop?.((current) => current === source ? previous : current);
  }, [source, setBackdrop]);
}

export function useIsTabletLayout() {
  const window = useWindowDimensions();
  // Native screen points identify the display class independently of keyboard
  // visibility and split-screen width. Web previews use their actual viewport.
  const display = Platform.OS === "web" ? window : Dimensions.get("screen");
  return Math.min(display.width, display.height) >= 600;
}

const PhoneViewportContext = createContext<{ width: number; height: number } | null>(null);

export function PhoneViewport({ children }: { children: React.ReactNode }) {
  const window = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [area, setArea] = useState<{ width: number; height: number } | null>(null);
  const initialArea = {
    width: window.width - insets.left - insets.right,
    height: window.height - insets.bottom,
  };

  return React.createElement(
    SafeAreaView,
    { style: { flex: 1, backgroundColor: "#F5F7FA" }, edges: ["bottom", "left", "right"] },
    React.createElement(
      View,
      {
        style: { flex: 1, overflow: "hidden" },
        onLayout: ({ nativeEvent: { layout } }: LayoutChangeEvent) => {
          // Keep the scene stable during adjustResize; focus animation handles the keyboard.
          if (Keyboard.isVisible() || layout.width <= 0 || layout.height <= 0) return;
          setArea((previous) => previous?.width === layout.width && previous.height === layout.height
            ? previous : { width: layout.width, height: layout.height });
        },
      },
      React.createElement(PhoneViewportContext.Provider, { value: area ?? initialArea }, children)
    )
  );
}

export function ScreenViewport({ tabletBackgroundSource, ...props }: React.ComponentProps<typeof TabletViewport> & { tabletBackgroundSource?: ImageSourcePropType }) {
  const tablet = useIsTabletLayout();
  return React.createElement(tablet ? TabletViewport : PhoneViewport, {
    ...props,
    backgroundSource: tablet ? tabletBackgroundSource ?? props.backgroundSource : props.backgroundSource,
  });
}

export function TabletOnlyViewport(props: React.ComponentProps<typeof TabletViewport>) {
  const tablet = useIsTabletLayout();
  return tablet ? React.createElement(TabletViewport, props) : React.createElement(React.Fragment, null, props.children);
}

export function useSceneMetrics(designContentHeight = 800) {
  const tablet = useIsTabletLayout();
  const phoneArea = useContext(PhoneViewportContext);
  const tabletArea = useContext(ViewportContext);
  const window = useWindowDimensions();
  const area = tablet ? tabletArea : phoneArea;
  const { width, height } = area ?? window;
  return {
    ...(tablet ? createTabletMetrics(width, height, designContentHeight) : createSceneMetrics(width, height, designContentHeight)),
    contentScale: tablet ? getTabletContentScale(width, height) : 1,
    isTabletLayout: tablet,
    topInset: tablet ? tabletArea?.topInset ?? 0 : 0,
    bottomInset: tablet ? tabletArea?.bottomInset ?? 0 : 0,
    backgroundHeight: tablet ? tabletArea?.backgroundHeight ?? height : height,
  };
}

// These wrappers add no native view or scrolling on phones: their child tree
// and legacy styles remain exactly those in the pre-tablet reference.
export function TabletFormScroll({ enabled, scroll, style, children }: {
  enabled: boolean; scroll: ReturnType<typeof useFormScroll>;
  style: StyleProp<ViewStyle>; children: React.ReactNode;
}) {
  if (!enabled) return React.createElement(React.Fragment, null, children);
  return React.createElement(ScrollView, {
    ref: scroll.scrollRef, contentContainerStyle: style,
    // The artwork keeps its full height during adjustResize. The scroll view
    // must still fit above the keyboard, otherwise its content cannot scroll.
    style: { flex: 1, maxHeight: scroll.visibleHeight ?? undefined },
    keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag",
    onScroll: scroll.onScroll, onLayout: scroll.onLayout, scrollEventThrottle: 16,
  }, children);
}

export function SceneOverlay({ tablet, animated = false, style, children }: {
  tablet: boolean; animated?: boolean; style: StyleProp<ViewStyle>; children: React.ReactNode;
}) {
  if (tablet) return React.createElement(ScrollView, {
    style: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, elevation: 100 },
    contentContainerStyle: style, bounces: false,
  }, children);
  return React.createElement(animated ? Animated.View : View, { style }, children);
}

// Scroll the actual focused field into view. Measuring after the keyboard event
// also handles floating/split iPad keyboards without a device-specific offset.
export function useFormScroll(enabled = true) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const focused = useRef<React.ComponentRef<typeof TextInput> | null>(null);
  const offset = useRef(0);
  const keyboardTop = useRef(Number.POSITIVE_INFINITY);
  const [visibleHeight, setVisibleHeight] = useState<number | null>(null);
  const reveal = () => {
    const input = focused.current;
    if (!input) return;
    scrollRef.current?.measure((_x, _y, _width, height, _pageX, top) => {
      input.measure((_ix, _iy, _iw, inputHeight, _inputX, inputTop) => {
        if (focused.current !== input) return;
        const bottom = Math.min(top + height, keyboardTop.current) - 16;
        const delta = inputTop < top + 16 ? inputTop - top - 16 : Math.max(0, inputTop + inputHeight - bottom);
        // Focus and keyboard layout can request a reveal in the same frame.
        // Avoid interrupting an in-flight scroll with a stale measured offset.
        if (delta) scrollRef.current?.scrollTo({ y: Math.max(0, offset.current + delta), animated: false });
      });
    });
  };
  useEffect(() => {
    if (!enabled) return;
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillChangeFrame" : "keyboardDidShow", (event) => {
      keyboardTop.current = event.endCoordinates.screenY;
      // Use page coordinates for both the focused field and the keyboard.
      // measureInWindow can subtract Android's status-bar inset in edge-to-edge.
      scrollRef.current?.measure((_x, _y, _width, _height, _pageX, top) => {
        setVisibleHeight(Math.max(1, event.endCoordinates.screenY - top));
      });
      requestAnimationFrame(reveal);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => {
      keyboardTop.current = Number.POSITIVE_INFINITY;
      setVisibleHeight(null);
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return () => { show.remove(); hide.remove(); };
  }, [enabled]);
  return {
    scrollRef,
    visibleHeight,
    onFocus: (input: React.ComponentRef<typeof TextInput> | null) => { focused.current = input; requestAnimationFrame(reveal); },
    onScroll: (event: { nativeEvent: { contentOffset: { y: number } } }) => { offset.current = event.nativeEvent.contentOffset.y; },
    onLayout: reveal,
  };
}

export type HitRect = { x: number; y: number; width: number; height: number };
export function containsPoint(rect: HitRect | null, x: number, y: number) {
  return !!rect && x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
}
