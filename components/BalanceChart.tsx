import { Canvas, Path } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

interface BalanceChartProps {
  dates: string[];
  balances: number[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

function formatCurrency(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDateLabel(dateStr: string): string {
  // Show as e.g. '14 May' or 'May 2024' if year changes
  const date = new Date(dateStr);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function BalanceChart({ dates, balances }: BalanceChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - CHART_PADDING * 2;

  // If no data, render nothing (could add a placeholder in the future)
  if (!dates.length || !balances.length) {
    return null;
  }

  // Scale data to fit chart dimensions
  const minBalance = Math.min(...balances, 0); // Always show at least $0
  const maxBalance = Math.max(...balances);
  const yRange = maxBalance - minBalance || 1; // Prevent division by zero

  const xStep = dates.length > 1 ? chartWidth / (dates.length - 1) : 0;

  // Map balances to chart Y coordinates (inverted, as 0 is top)
  const points = balances.map((bal, i) => ({
    x: CHART_PADDING + i * xStep,
    y: CHART_HEIGHT - ((bal - minBalance) / yRange) * CHART_HEIGHT + CHART_PADDING,
  }));

  // Build path string
  let pathString = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    pathString += ` L ${points[i].x} ${points[i].y}`;
  }

  // Format axis labels
  const minLabel = formatCurrency(minBalance);
  const maxLabel = formatCurrency(maxBalance);
  const firstDateLabel = formatDateLabel(dates[0]);
  const lastDateLabel = formatDateLabel(dates[dates.length - 1]);

  return (
    <View style={styles.container}>
      {/* Y-axis labels */}
      <View style={styles.yAxisLabels}>
        <Text style={styles.axisLabel}>{maxLabel}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.axisLabel}>{minLabel}</Text>
      </View>
      {/* Chart Canvas */}
      <Canvas style={{ width: windowWidth, height: CHART_HEIGHT + CHART_PADDING * 2 }}>
        <Path
          path={pathString}
          color="lightblue"
          style="stroke"
          strokeWidth={3}
        />
      </Canvas>
      {/* X-axis labels */}
      <View style={styles.xAxisLabels}>
        <Text style={styles.axisLabel}>{firstDateLabel}</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.axisLabel}>{lastDateLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  yAxisLabels: {
    position: 'absolute',
    left: 0,
    top: CHART_PADDING,
    height: CHART_HEIGHT,
    width: 80,
    zIndex: 2,
    justifyContent: 'space-between',
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