import { Canvas, CornerPathEffect, Line, Skia, Path as SkiaPath } from '@shopify/react-native-skia';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { runOnJS, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

interface Point { x: number; y: number; }

interface BalanceChartProps {
  dates: string[];
  balances: number[];
  isLoading: boolean;
}

const CHART_HEIGHT = 300;
const CHART_PADDING = 16;
const CHART_BOTTOM_PADDING = 2; // Extra space for min label
const CALLOUT_WIDTH = 120;
const CALLOUT_HEIGHT = 60;
const CALLOUT_TOP_PADDING = 8;
const CHART_TOP_OFFSET = CALLOUT_HEIGHT + CALLOUT_TOP_PADDING;
const CANVAS_HEIGHT = CHART_HEIGHT + CHART_PADDING * 2 + CHART_TOP_OFFSET;
const LOADING_ANIMATION_DURATION = 2000; // 2 seconds per cycle

const formatCurrency = (value: number): string => {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Restore the function definition
const formatDateForCalloutLabel = (dateStr: string): string => {
  if (typeof dateStr !== 'string' || !dateStr) {
    return 'Invalid DateStr'; 
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'Invalid Date Obj';
    }
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Date Format Error'; 
  }
};

interface CalloutData {
  xPosition: number; // screen x to position callout (center of data point)
  yPosition: number; // screen y of the data point on graph
  date: string;
  balance: number;
  isVisible: boolean;
}

export default function BalanceChart({ dates, balances, isLoading }: BalanceChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - CHART_PADDING * 2;

  const touchX = useSharedValue<number | null>(null);
  const isActive = useSharedValue(false);

  // React state for callout data & positioning
  const [calloutData, setCalloutData] = useState<CalloutData | null>(null);

  // Animation shared values
  const previousPoints = useSharedValue<Point[]>([]);
  const currentPoints = useSharedValue<Point[]>([]);
  const animationProgress = useSharedValue(0);

  // Add loading animation shared value
  const loadingAnimationProgress = useSharedValue(0);
  const loadingToDataTransition = useSharedValue(0);
  const dataTransitionProgress = useSharedValue(1); // New shared value for data transitions

  const yTop = CHART_TOP_OFFSET + CHART_PADDING;
  const yBottom = CHART_TOP_OFFSET + CHART_HEIGHT + CHART_PADDING - CHART_BOTTOM_PADDING;

  // Function to update callout data (to be called from JS thread)
  const updateCalloutJS = (data: CalloutData | null) => {
    setCalloutData(data);
  };

  useEffect(() => {
    let effectivePlotDates = dates;
    let effectivePlotBalances = balances;
    let currentIsEmptyState = false;

    if (isLoading) {
      const oldPoints = [...currentPoints.value];
      previousPoints.value = oldPoints;
      currentPoints.value = []; // Target empty state
      animationProgress.value = 0;
      animationProgress.value = withTiming(1, { duration: 300 });
      return;
    }

    if (!dates.length || !balances.length) {
      currentIsEmptyState = true;
      const today = new Date().toISOString().slice(0, 10);
      effectivePlotDates = [today, today];
      effectivePlotBalances = [0, 0];
    }

    const currentMinBalance = currentIsEmptyState ? 0 : Math.min(...effectivePlotBalances);
    const currentMaxBalance = currentIsEmptyState ? 0 : Math.max(...effectivePlotBalances);
    let currentYRange = currentMaxBalance - currentMinBalance;
    if (currentYRange === 0) {
      currentYRange = currentIsEmptyState ? 1 : (currentMaxBalance === 0 ? 1 : Math.abs(currentMaxBalance * 0.1) || 1);
    }
    const currentXStep = effectivePlotDates.length > 1 ? chartWidth / (effectivePlotDates.length - 1) : chartWidth;

    const newCalculatedPoints: Point[] = effectivePlotBalances.map((bal, i) => ({
      x: CHART_PADDING + i * currentXStep,
      y: yTop + (1 - (bal - currentMinBalance) / currentYRange) * (yBottom - yTop),
    }));

    const oldCurrentPoints = [...currentPoints.value];
    currentPoints.value = [...newCalculatedPoints];

    if (oldCurrentPoints.length === 0 && newCalculatedPoints.length > 0) {
      // First data load after being empty, animate from bottom
      previousPoints.value = newCalculatedPoints.map(p => ({ x: p.x, y: yBottom }));
    } else {
      previousPoints.value = oldCurrentPoints;
    }
    
    animationProgress.value = 0;
    animationProgress.value = withTiming(1, { duration: 500 });

  }, [dates, balances, isLoading, chartWidth, yTop, yBottom, CHART_PADDING, windowWidth]);

  // Modify loading animation effect
  useEffect(() => {
    if (isLoading) {
      loadingAnimationProgress.value = 0;
      loadingAnimationProgress.value = withRepeat(
        withTiming(1, { duration: LOADING_ANIMATION_DURATION }),
        -1, // Infinite repeat
        false // Reverse
      );
      loadingToDataTransition.value = 0;
      dataTransitionProgress.value = 1;
    } else {
      // When loading completes, animate to the actual data
      loadingAnimationProgress.value = withTiming(0, { duration: 300 });
      loadingToDataTransition.value = withTiming(1, { duration: 500 });
    }
  }, [isLoading]);

  // Add loading animation path
  const loadingPath = useDerivedValue(() => {
    const progress = loadingAnimationProgress.value;
    const path = Skia.Path.Make();
    const numPoints = 20;
    const xStep = chartWidth / (numPoints - 1);
    const amplitude = 20; // Height of the wiggle

    path.moveTo(CHART_PADDING, yTop + (yBottom - yTop) / 2);

    for (let i = 1; i < numPoints; i++) {
      const x = CHART_PADDING + i * xStep;
      const y = yTop + (yBottom - yTop) / 2 + 
        Math.sin((i / numPoints) * Math.PI * 2 + progress * Math.PI * 2) * amplitude;
      path.lineTo(x, y);
    }

    return path;
  }, [chartWidth, yTop, yBottom, CHART_PADDING]);

  // Modify the main path animation to include both loading and data transitions
  const animatedSkPath = useDerivedValue(() => {
    const transition = loadingToDataTransition.value;
    
    // If we're still loading, show the loading animation
    if (transition === 0) {
      return loadingPath.value;
    }

    // Calculate the actual data points
    let effectivePlotDates = dates;
    let effectivePlotBalances = balances;
    let currentIsEmptyState = false;

    if (!dates.length || !balances.length) {
      currentIsEmptyState = true;
      const today = new Date().toISOString().slice(0, 10);
      effectivePlotDates = [today, today];
      effectivePlotBalances = [0, 0];
    }

    const currentMinBalance = currentIsEmptyState ? 0 : Math.min(...effectivePlotBalances);
    const currentMaxBalance = currentIsEmptyState ? 0 : Math.max(...effectivePlotBalances);
    let currentYRange = currentMaxBalance - currentMinBalance;
    if (currentYRange === 0) {
      currentYRange = currentIsEmptyState ? 1 : (currentMaxBalance === 0 ? 1 : Math.abs(currentMaxBalance * 0.1) || 1);
    }
    const currentXStep = effectivePlotDates.length > 1 ? chartWidth / (effectivePlotDates.length - 1) : chartWidth;

    const newCalculatedPoints: Point[] = effectivePlotBalances.map((bal, i) => ({
      x: CHART_PADDING + i * currentXStep,
      y: yTop + (1 - (bal - currentMinBalance) / currentYRange) * (yBottom - yTop),
    }));

    // Create the actual data path
    const dataPath = Skia.Path.Make();
    if (newCalculatedPoints.length > 0) {
      dataPath.moveTo(newCalculatedPoints[0].x, newCalculatedPoints[0].y);
      for (let i = 1; i < newCalculatedPoints.length; i++) {
        dataPath.lineTo(newCalculatedPoints[i].x, newCalculatedPoints[i].y);
      }
    }

    // If we're in loading transition, interpolate between loading and data paths
    if (transition < 1) {
      // Create loading points array
      const numLoadingPoints = 20;
      const loadingPoints: Point[] = [];
      const xStep = chartWidth / (numLoadingPoints - 1);
      const amplitude = 20;

      for (let i = 0; i < numLoadingPoints; i++) {
        const x = CHART_PADDING + i * xStep;
        const y = yTop + (yBottom - yTop) / 2 + 
          Math.sin((i / numLoadingPoints) * Math.PI * 2 + loadingAnimationProgress.value * Math.PI * 2) * amplitude;
        loadingPoints.push({ x, y });
      }

      // Create interpolated path
      const interpolatedPath = Skia.Path.Make();
      const numPoints = Math.max(loadingPoints.length, newCalculatedPoints.length);
      
      for (let i = 0; i < numPoints; i++) {
        const loadingPoint = loadingPoints[i] || loadingPoints[loadingPoints.length - 1];
        const dataPoint = newCalculatedPoints[i] || newCalculatedPoints[newCalculatedPoints.length - 1];
        
        const x = loadingPoint.x + (dataPoint.x - loadingPoint.x) * transition;
        const y = loadingPoint.y + (dataPoint.y - loadingPoint.y) * transition;
        
        if (i === 0) {
          interpolatedPath.moveTo(x, y);
        } else {
          interpolatedPath.lineTo(x, y);
        }
      }
      
      return interpolatedPath;
    }

    // If we're in data transition (between time frames)
    if (dataTransitionProgress.value < 1) {
      const interpolatedPath = Skia.Path.Make();
      const prevPoints = previousPoints.value;
      const currPoints = newCalculatedPoints;
      const progress = dataTransitionProgress.value;

      // Use the maximum number of points between previous and current
      const numPoints = Math.max(prevPoints.length, currPoints.length);

      for (let i = 0; i < numPoints; i++) {
        const prevPoint = prevPoints[i] || prevPoints[prevPoints.length - 1];
        const currPoint = currPoints[i] || currPoints[currPoints.length - 1];

        const x = prevPoint.x + (currPoint.x - prevPoint.x) * progress;
        const y = prevPoint.y + (currPoint.y - prevPoint.y) * progress;

        if (i === 0) {
          interpolatedPath.moveTo(x, y);
        } else {
          interpolatedPath.lineTo(x, y);
        }
      }

      return interpolatedPath;
    }

    return dataPath;
  }, [dates, balances, chartWidth, yTop, yBottom, CHART_PADDING, loadingAnimationProgress.value, dataTransitionProgress.value]);

  // Add effect to handle data transitions
  useEffect(() => {
    if (isLoading) {
      loadingAnimationProgress.value = 0;
      loadingAnimationProgress.value = withRepeat(
        withTiming(1, { duration: LOADING_ANIMATION_DURATION }),
        -1,
        false
      );
      loadingToDataTransition.value = 0;
      dataTransitionProgress.value = 1;
    } else {
      // Store current points before updating
      const currentPoints = animatedSkPath.value ? 
        Array.from({ length: 20 }, (_, i) => {
          const x = CHART_PADDING + (i * chartWidth) / 19;
          const y = yTop + (yBottom - yTop) / 2;
          return { x, y };
        }) : [];
      
      previousPoints.value = currentPoints;
      
      // Start transition animation
      dataTransitionProgress.value = 0;
      dataTransitionProgress.value = withTiming(1, { duration: 500 });
      
      // Handle loading to data transition
      loadingAnimationProgress.value = withTiming(0, { duration: 300 });
      loadingToDataTransition.value = withTiming(1, { duration: 500 });
    }
  }, [dates, balances, isLoading, chartWidth, yTop, yBottom, CHART_PADDING]);

  // The rest of the component logic that depends on current (non-animated) data for labels, callouts etc.
  // needs to use the most recent props (dates, balances) or derived values from them, not animated state.
  // For simplicity, callout and labels will use data derived similarly to how newCalculatedPoints is made in useEffect.
  // This part needs careful review if labels/callouts should also animate or sync with the animated path's perceived state.
  // For now, they will reflect the *target* state.

  let displayPlotDates = dates;
  let displayPlotBalances = balances;
  let displayIsEmptyState = false;
  if (isLoading) {
    // Return loading placeholder directly, animation logic is for when not loading
    return (
      <View style={[styles.container, { height: CANVAS_HEIGHT }]}>
        <Canvas style={{ width: windowWidth, height: CANVAS_HEIGHT }}>
          {/* Top guide line */}
          <Line p1={{ x: CHART_PADDING, y: yTop }} p2={{ x: windowWidth - CHART_PADDING, y: yTop }} color="#666" strokeWidth={1} style="stroke" />
          {/* Bottom guide line */}
          <Line p1={{ x: CHART_PADDING, y: yBottom }} p2={{ x: windowWidth - CHART_PADDING, y: yBottom }} color="#666" strokeWidth={1} style="stroke" />
          {/* Loading animation line */}
          <SkiaPath
            path={loadingPath}
            color="lightblue"
            style="stroke"
            strokeWidth={3}
          >
            <CornerPathEffect r={25} />
          </SkiaPath>
        </Canvas>
        <Text style={[styles.placeholderText, { position: 'absolute', bottom: CHART_PADDING * 4 }]}>
          Loading...this can take a while
        </Text>
      </View>
    );
  }
  if (!dates.length || !balances.length) {
    displayIsEmptyState = true;
    const today = new Date().toISOString().slice(0, 10);
    displayPlotDates = [today, today];
    displayPlotBalances = [0, 0];
  }
  const displayMinBalance = displayIsEmptyState ? 0 : Math.min(...displayPlotBalances);
  const displayMaxBalance = displayIsEmptyState ? 0 : Math.max(...displayPlotBalances);
  const displayXStep = displayPlotDates.length > 1 ? chartWidth / (displayPlotDates.length - 1) : 0;
  
  // Points for callout - uses instantaneous data
  const currentDisplayPoints = displayPlotBalances.map((bal, i) => {
    let currentYRange = displayMaxBalance - displayMinBalance;
    if (currentYRange === 0) {
      currentYRange = displayIsEmptyState ? 1 : (displayMaxBalance === 0 ? 1 : Math.abs(displayMaxBalance * 0.1) || 1);
    }
    return {
      x: CHART_PADDING + i * displayXStep,
      y: yTop + (1 - (bal - displayMinBalance) / currentYRange) * (yBottom - yTop),
    };
  });

  const minLabel = formatCurrency(displayMinBalance);
  const maxLabel = formatCurrency(displayMaxBalance);
  // Axis labels will now call the restored function
  const firstDateLabel = displayPlotDates.length > 0 && displayPlotDates[0] ? formatDateForCalloutLabel(displayPlotDates[0]) : "";
  const lastDateLabel = displayPlotDates.length > 0 && displayPlotDates[displayPlotDates.length - 1] ? formatDateForCalloutLabel(displayPlotDates[displayPlotDates.length - 1]) : "";

  // Use displayMinBalance, displayMaxBalance, displayPlotDates for labels
  const finalMinLabel = formatCurrency(displayMinBalance);
  const finalMaxLabel = formatCurrency(displayMaxBalance);
  const finalFirstDateLabel = displayPlotDates.length > 0 && displayPlotDates[0] ? formatDateForCalloutLabel(displayPlotDates[0]) : "";
  const finalLastDateLabel = displayPlotDates.length > 0 && displayPlotDates[displayPlotDates.length - 1] ? formatDateForCalloutLabel(displayPlotDates[displayPlotDates.length - 1]) : "";

  const panGesture = Gesture.Pan()
    .onBegin((event: PanGestureHandlerEventPayload) => {
      isActive.value = true;
      touchX.value = event.x;
      // touchY.value = event.y; // Keep commented if not strictly needed yet
     //console.log(`Gesture Begin: x=${event.x.toFixed(2)}, y=${event.y.toFixed(2)} (absolute component coords)`); // Ensure this is active
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      // console.log('Gesture Update event raw:', event); // Simplest log to check if onUpdate is firing
      if (isActive.value) {
        touchX.value = event.x;
        const currentX = event.x;

        //console.log(`Gesture Update: currentX=${currentX.toFixed(2)}`); // More specific log

        if (currentX !== null && displayXStep > 0 && displayPlotDates.length > 0) {
          const chartRelativeX = currentX - CHART_PADDING;
          let selectedIndex = Math.round(chartRelativeX / displayXStep);
          selectedIndex = Math.max(0, Math.min(displayPlotDates.length - 1, selectedIndex));

          // console.log(`onUpdate: chartRelativeX=${chartRelativeX}, selectedIndex=${selectedIndex}`); // Debugging
          // console.log('Type of formatDateForCalloutLabel:', typeof formatDateForCalloutLabel, formatDateForCalloutLabel);
          //console.log('Value of date to be formatted:', displayPlotDates[selectedIndex]);

          if (selectedIndex >= 0 && selectedIndex < displayPlotDates.length) {
            try {
              const point = currentDisplayPoints[selectedIndex];
              const dateStr = displayPlotDates[selectedIndex]; 
              const balance = displayPlotBalances[selectedIndex];
              
              if (point === undefined || dateStr === undefined || balance === undefined) {
                runOnJS(updateCalloutJS)(null);
                return;
              }

              // Keep Inlined date formatting logic for the callout as it was working
              let formattedDateForCallout;
              if (typeof dateStr !== 'string' || !dateStr) {
                formattedDateForCallout = 'Invalid DateStr';
              } else {
                try {
                  const dateObj = new Date(dateStr);
                  if (isNaN(dateObj.getTime())) {
                    formattedDateForCallout = 'Invalid Date Obj';
                  } else {
                    formattedDateForCallout = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                  }
                } catch (e) {
                  formattedDateForCallout = 'Date Format Error';
                }
              }
              // --- Inlined date formatting logic --- END

              // Center callout at the top, horizontally above the selected point
              const calloutXPosition = point.x - (CALLOUT_WIDTH / 2);
              const dataForCallout: CalloutData = {
                xPosition: point.x, // center of the data point for vertical line
                yPosition: point.y, // y of the data point
                date: formattedDateForCallout,
                balance: balance,
                isVisible: true,
              };
              //console.log('Data for callout state update:', JSON.stringify(dataForCallout));
              runOnJS(updateCalloutJS)(dataForCallout);
            } catch (e: any) {
              //console.error('Error processing data for callout:', e.message); // Ensure this logs if error occurs
              runOnJS(updateCalloutJS)(null);
            }
          } else {
            runOnJS(updateCalloutJS)(null);
          }
        } else {
          runOnJS(updateCalloutJS)(null);
        }
      }
    })
    .onEnd(() => {
      isActive.value = false;
      runOnJS(updateCalloutJS)(null); // Hide callout on gesture end
    })
    .minDistance(1)
    .shouldCancelWhenOutside(false); // Keep tracking even if finger slides out briefly

  return (
    <GestureDetector gesture={panGesture}>
      <View style={[styles.container, { height: CANVAS_HEIGHT }]}>
        {/* Callout View at top */}
        {calloutData?.isVisible && (
          <View
            style={[
              styles.calloutContainerFixedTop,
              {
                left: Math.max(
                  0,
                  Math.min(
                    (calloutData.xPosition - CALLOUT_WIDTH / 2),
                    windowWidth - CHART_PADDING - CALLOUT_WIDTH
                  )
                ),
                top: CALLOUT_TOP_PADDING,
              },
            ]}
          >
            <Text style={styles.calloutText}>{calloutData.date}</Text>
            <Text style={styles.calloutText}>{formatCurrency(calloutData.balance)}</Text>
          </View>
        )}
        {/* Chart Canvas with guide lines and vertical line */}
        <Canvas style={{ width: windowWidth, height: CANVAS_HEIGHT }}>
          {/* Top guide line */}
          <Line p1={{ x: CHART_PADDING, y: yTop }} p2={{ x: windowWidth - 100, y: yTop }} color="#666" strokeWidth={1} style="stroke" />
          {/* Bottom guide line */}
          <Line p1={{ x: CHART_PADDING, y: yBottom }} p2={{ x: windowWidth - 100, y: yBottom }} color="#666" strokeWidth={1} style="stroke" />
          {/* Chart line - now uses animatedSkPath which includes loading state */}
          <SkiaPath
            path={animatedSkPath}
            color="lightblue"
            style="stroke"
            strokeWidth={3}
          >
            <CornerPathEffect r={25} />
          </SkiaPath>
          {/* Vertical line from callout to chart point */}
          {calloutData?.isVisible && (
            <Line
              p1={{ x: calloutData.xPosition, y: CALLOUT_TOP_PADDING + CALLOUT_HEIGHT }}
              p2={{ x: calloutData.xPosition, y: calloutData.yPosition }}
              color="#888"
              strokeWidth={1}
              style="stroke"
              opacity={0.5}
            />
          )}
        </Canvas>
        {/* Max label (top right) */}
        <Text style={[styles.axisLabel, styles.maxLabel, { top: yTop - 8, right: CHART_PADDING }]}>{finalMaxLabel}</Text>
        {/* Min label (bottom right, in-line with bottom guide) */}
        <Text style={[styles.axisLabel, styles.minLabel, { top: yBottom - 8, right: CHART_PADDING }]}>{finalMinLabel}</Text>
        {/* X-axis labels */}
        <View style={[styles.xAxisLabels, { marginTop: 4 }]}>
          <Text style={styles.axisLabel}>{finalFirstDateLabel}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.axisLabel}>{finalLastDateLabel}</Text>
        </View>
        {displayIsEmptyState && (
          <Text style={[styles.placeholderText, { position: 'absolute', bottom: CHART_PADDING }]}>
            No savings data to display.
          </Text>
        )}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
    position: 'relative', // Add this to ensure absolute positioning works correctly
  },
  placeholderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#B0B0B0',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  maxLabel: {
    position: 'absolute',
    zIndex: 3,
    textAlign: 'right',
  },
  minLabel: {
    position: 'absolute',
    zIndex: 3,
    textAlign: 'right',
  },
  xAxisLabels: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: CHART_PADDING,
  },
  axisLabel: {
    color: '#B0B0B0',
    fontSize: 12,
    fontWeight: '500',
  },
  calloutContainer: {
    position: 'absolute',
    width: CALLOUT_WIDTH,
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
    padding: 8,
    borderRadius: 6,
    borderColor: '#555',
    borderWidth: 1,
    zIndex: 10,
    alignItems: 'center',
  },
  calloutContainerFixedTop: {
    position: 'absolute',
    width: CALLOUT_WIDTH,
    backgroundColor: 'rgba(40, 40, 40, 0.9)',
    padding: 8,
    borderRadius: 6,
    borderColor: '#555',
    borderWidth: 1,
    zIndex: 10,
    alignItems: 'center',
  },
  calloutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
}); 