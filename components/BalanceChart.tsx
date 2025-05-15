import { Canvas, Line, Path } from '@shopify/react-native-skia';
import React, { useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector, GestureUpdateEvent, PanGestureHandlerEventPayload } from 'react-native-gesture-handler';
import { runOnJS, useSharedValue } from 'react-native-reanimated';

interface BalanceChartProps {
  dates: string[];
  balances: number[];
  isLoading: boolean;
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 16;
const CHART_BOTTOM_PADDING = 2; // Extra space for min label
const CALLOUT_WIDTH = 120;
const CALLOUT_HEIGHT = 60;

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
  xPosition: number; // screen x to position callout
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

  // Original plotting logic (refactored slightly for clarity and use in gesture)
  let plotDates = dates;
  let plotBalances = balances;
  let isEmptyState = false;

  if (isLoading) {
    return (
      <View style={[styles.container, styles.placeholderContainer]}>
        <Text style={styles.placeholderText}>Loading savings data...</Text>
      </View>
    );
  }

  if (!dates.length || !balances.length) {
    isEmptyState = true;
    const today = new Date().toISOString().slice(0, 10);
    plotDates = [today, today]; 
    plotBalances = [0, 0];
  }

  const minBalance = isEmptyState ? 0 : Math.min(...plotBalances);
  const maxBalance = isEmptyState ? 0 : Math.max(...plotBalances);
  const yRange = (maxBalance - minBalance) || (isEmptyState ? 1 : (maxBalance === 0 ? 1 : maxBalance * 0.1) || 1);
  const xStep = plotDates.length > 1 ? chartWidth / (plotDates.length - 1) : 0;
  const yTop = CHART_PADDING;
  const yBottom = CHART_HEIGHT + CHART_PADDING - CHART_BOTTOM_PADDING;

  // console.log(`Chart Calculated Values: xStep=${xStep}, yRange=${yRange}, minBalance=${minBalance}, maxBalance=${maxBalance}`); // Added for debugging

  const points = plotBalances.map((bal, i) => ({
    x: CHART_PADDING + i * xStep,
    y: yTop + (1 - (bal - minBalance) / yRange) * (yBottom - yTop),
  }));

  const pathString = points.length > 0 ? `M ${points[0].x} ${points[0].y}${points.slice(1).map(p => ` L ${p.x} ${p.y}`).join('')}` : `M ${CHART_PADDING} ${yBottom} L ${windowWidth - CHART_PADDING} ${yBottom}`;

  // Function to update callout data (to be called from JS thread)
  const updateCalloutJS = (data: CalloutData | null) => {
    setCalloutData(data);
  };

  const panGesture = Gesture.Pan()
    .onBegin((event: PanGestureHandlerEventPayload) => {
      isActive.value = true;
      touchX.value = event.x;
      // touchY.value = event.y; // Keep commented if not strictly needed yet
      console.log(`Gesture Begin: x=${event.x.toFixed(2)}, y=${event.y.toFixed(2)} (absolute component coords)`); // Ensure this is active
    })
    .onUpdate((event: GestureUpdateEvent<PanGestureHandlerEventPayload>) => {
      // console.log('Gesture Update event raw:', event); // Simplest log to check if onUpdate is firing
      if (isActive.value) {
        touchX.value = event.x;
        const currentX = event.x;

        console.log(`Gesture Update: currentX=${currentX.toFixed(2)}`); // More specific log

        if (currentX !== null && xStep > 0 && plotDates.length > 0) {
          const chartRelativeX = currentX - CHART_PADDING;
          let selectedIndex = Math.round(chartRelativeX / xStep);
          selectedIndex = Math.max(0, Math.min(plotDates.length - 1, selectedIndex));

          // console.log(`onUpdate: chartRelativeX=${chartRelativeX}, selectedIndex=${selectedIndex}`); // Debugging
          console.log('Type of formatDateForCalloutLabel:', typeof formatDateForCalloutLabel, formatDateForCalloutLabel);
          console.log('Value of date to be formatted:', plotDates[selectedIndex]);

          if (selectedIndex >= 0 && selectedIndex < plotDates.length) {
            try {
              const point = points[selectedIndex];
              const dateStr = plotDates[selectedIndex]; 
              const balance = plotBalances[selectedIndex];
              
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

              let calloutXPosition = point.x - (CALLOUT_WIDTH / 2); 
              calloutXPosition = Math.max(CHART_PADDING, calloutXPosition);
              calloutXPosition = Math.min(windowWidth - CHART_PADDING - CALLOUT_WIDTH, calloutXPosition);

              const dataForCallout: CalloutData = {
                xPosition: calloutXPosition, 
                yPosition: point.y - CALLOUT_HEIGHT - 8, 
                date: formattedDateForCallout, // Use inlined result for callout
                balance: balance, 
                isVisible: true,
              };
              console.log('Data for callout state update:', JSON.stringify(dataForCallout));
              runOnJS(updateCalloutJS)(dataForCallout);
            } catch (e: any) {
              console.error('Error processing data for callout:', e.message); // Ensure this logs if error occurs
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

  const minLabel = formatCurrency(minBalance);
  const maxLabel = formatCurrency(maxBalance);
  // Axis labels will now call the restored function
  const firstDateLabel = plotDates.length > 0 && plotDates[0] ? formatDateForCalloutLabel(plotDates[0]) : ""; 
  const lastDateLabel = plotDates.length > 0 && plotDates[plotDates.length - 1] ? formatDateForCalloutLabel(plotDates[plotDates.length - 1]) : "";

  return (
    <GestureDetector gesture={panGesture}>
      <View style={styles.container}>
        {/* Callout View */} 
        {calloutData?.isVisible && (
          <View 
            style={[
              styles.calloutContainer, 
              { 
                left: calloutData.xPosition,
                top: calloutData.yPosition,
              }
            ]}
          >
            <Text style={styles.calloutText}>{calloutData.date}</Text>
            <Text style={styles.calloutText}>{formatCurrency(calloutData.balance)}</Text>
          </View>
        )}

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
  calloutText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
}); 