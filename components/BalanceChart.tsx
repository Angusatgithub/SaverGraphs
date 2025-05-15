import { Canvas, Line, Path } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

interface BalanceChartProps {
  dates: string[];
  balances: number[];
  isLoading: boolean;
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 16;
const CHART_BOTTOM_PADDING = 2; // Extra space for min label

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(dateStr: string): string {
  // Show as e.g. '14 May' or 'May 2024' if year changes
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BalanceChart({ dates, balances, isLoading }: BalanceChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - CHART_PADDING * 2;

  const touchX = useSharedValue<number | null>(null);
  const touchY = useSharedValue<number | null>(null);
  const isActive = useSharedValue(false);

  const panGesture = Gesture.Pan()
    .onBegin((event: PanGestureHandlerEventPayload) => {
      isActive.value = true;
      touchX.value = event.x;
      touchY.value = event.y;
      console.log(`Gesture Begin: x=${event.x.toFixed(2)}, y=${event.y.toFixed(2)} (absolute component coords)`);
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      if (isActive.value) {
        // event.x, event.y are absolute coords within the GestureDetector view
        touchX.value = event.x;
        touchY.value = event.y;
        // For Story 3.4, just log. For Story 3.5, we'll need to check if within chart bounds for callout.
        console.log(`Gesture Update: x=${event.x.toFixed(2)}, y=${event.y.toFixed(2)} (absolute component coords)`);
      }
    })
    .onEnd(() => {
      isActive.value = false;
      console.log('Gesture End');
      // Decide if touchX/Y should be reset for tap-like behavior or kept for last scrub position
      // touchX.value = null; 
      // touchY.value = null;
    })
    .minDistance(1) // Prevents conflict with potential future tap gestures
    .shouldCancelWhenOutside(true);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.placeholderContainer]}>
        <Text style={styles.placeholderText}>Loading savings data...</Text>
      </View>
    );
  }

  let plotDates = dates;
  let plotBalances = balances;
  let isEmptyState = false;

  if (!dates.length || !balances.length) {
    isEmptyState = true;
    // Create a flat line for "No data"
    const today = new Date().toISOString().slice(0, 10);
    plotDates = [today, today]; // Need at least two points for a line
    plotBalances = [0, 0];
  } else {
    // Original logic to find the first non-zero (or first) balance index
    let firstIdx = 0;
    // This logic to slice data might not be ideal for showing actual trends from zero
    // For now, keeping it as is, but might need review for financial accuracy if balances *start* at 0
    // and that 0 is meaningful data.
    // while (firstIdx < balances.length && balances[firstIdx] === 0) {
    //   firstIdx++;
    // }
    // plotDates = dates.slice(firstIdx);
    // plotBalances = balances.slice(firstIdx);
    // If, after slicing, we end up with less than 2 points, it's effectively an empty/flat state
    // if (plotDates.length < 2) {
    //   isEmptyState = true;
    //   const today = new Date().toISOString().slice(0, 10);
    //   plotDates = [today, today];
    //   plotBalances = [0, 0];
    // }
  }

  // Y-axis: use min/max from actual data (not forced to $0 unless $0 is present)
  // For empty state, min/max will be 0.
  const minBalance = isEmptyState ? 0 : Math.min(...plotBalances);
  const maxBalance = isEmptyState ? 0 : Math.max(...plotBalances);
  // Ensure yRange is at least 1, or a small number if min/max are same (e.g. all 0 for empty state)
  const yRange = (maxBalance - minBalance) || (isEmptyState ? 1 : (maxBalance === 0 ? 1 : maxBalance * 0.1) || 1);

  const xStep = plotDates.length > 1 ? chartWidth / (plotDates.length - 1) : 0;

  // Y positions for guide lines and labels
  const yTop = CHART_PADDING;
  const yBottom = CHART_HEIGHT + CHART_PADDING - CHART_BOTTOM_PADDING;
  const labelRight = windowWidth - CHART_PADDING;

  // Map balances to chart Y coordinates (inverted, as 0 is top)
  // Max value -> y = yTop (top line)
  // Min value -> y = yBottom (bottom line)
  const points = plotBalances.map((bal, i) => ({
    x: CHART_PADDING + i * xStep,
    y: yTop + (1 - (bal - minBalance) / yRange) * (yBottom - yTop),
  }));

  // Build path string
  let pathString = "";
  if (points.length > 0) {
    pathString = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathString += ` L ${points[i].x} ${points[i].y}`;
    }
  } else { // Should not happen with current logic that ensures plotDates has 2 points for empty.
    pathString = `M ${CHART_PADDING} ${yBottom} L ${windowWidth - CHART_PADDING} ${yBottom}`; // Default flat line
  }

  // Format axis labels
  const minLabel = formatCurrency(minBalance);
  const maxLabel = formatCurrency(maxBalance);
  const firstDateLabel = plotDates.length > 0 ? formatDateLabel(plotDates[0]) : "";
  const lastDateLabel = plotDates.length > 0 ? formatDateLabel(plotDates[plotDates.length - 1]) : "";

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {isEmptyState && (
          <Text style={styles.placeholderText}>No savings data to display.</Text>
        )}
        {/* Chart Canvas with guide lines */}
        <Canvas style={{ width: windowWidth, height: CHART_HEIGHT + CHART_PADDING * 2 }}>
          {/* Top guide line */}
          <Line p1={{ x: CHART_PADDING, y: yTop }} p2={{ x: windowWidth - CHART_PADDING, y: yTop }} color="#666" strokeWidth={1} style="stroke" />
          {/* Bottom guide line */}
          <Line p1={{ x: CHART_PADDING, y: yBottom }} p2={{ x: windowWidth - CHART_PADDING, y: yBottom }} color="#666" strokeWidth={1} style="stroke" />
          {/* Chart line */}
          <Path
            path={pathString}
            color="lightblue"
            style="stroke"
            strokeWidth={3}
          />
        </Canvas>
        {/* Max label (top right) */}
        <Text style={[styles.axisLabel, styles.maxLabel, { top: yTop - 8, right: CHART_PADDING }]}>{maxLabel}</Text>
        {/* Min label (bottom right, in-line with bottom guide) */}
        <Text style={[styles.axisLabel, styles.minLabel, { top: yBottom - 8, right: CHART_PADDING }]}>{minLabel}</Text>
        {/* X-axis labels */}
        <View style={[styles.xAxisLabels, { marginTop: 4 }]}>
          <Text style={styles.axisLabel}>{firstDateLabel}</Text>
          <View style={{ flex: 1 }} />
          <Text style={styles.axisLabel}>{lastDateLabel}</Text>
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20, // Adjusted from 32 for placeholder text
    alignItems: 'center',
    width: '100%',
  },
  placeholderContainer: {
    height: CHART_HEIGHT + CHART_PADDING * 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#B0B0B0',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: CHART_HEIGHT / 2, // Position it roughly in the middle of where chart would be
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
}); 