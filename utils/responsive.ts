import { Dimensions, useWindowDimensions } from "react-native";

export const BASE_WIDTH = 393;
export const BASE_HEIGHT = 852;

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

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  return createResponsiveMetrics(width, height);
}
