import { Canvas, Path } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

interface BalanceChartProps {
  dates: string[];
  balances: number[];
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

export default function BalanceChart({ dates, balances }: BalanceChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - CHART_PADDING * 2;

  // If no data, render nothing (could add a placeholder in the future)
  if (!dates.length || !balances.length) {
    return null;
  }

  // Scale data to fit chart dimensions
  const minBalance = Math.min(...balances);
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

  return (
    <View style={styles.container}>
      <Canvas style={{ width: windowWidth, height: CHART_HEIGHT + CHART_PADDING * 2 }}>
        <Path
          path={pathString}
          color="lightblue"
          style="stroke"
          strokeWidth={3}
        />
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
}); 