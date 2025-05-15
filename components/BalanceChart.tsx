import { Canvas, Path } from '@shopify/react-native-skia';
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';

interface BalanceChartProps {
  // For now, no props are needed as we'll use hardcoded data
  // Later, we'll pass data, colors, etc.
}

const CHART_HEIGHT = 200;
const CHART_PADDING = 20;

export default function BalanceChart({}: BalanceChartProps) {
  const { width: windowWidth } = useWindowDimensions();
  const chartWidth = windowWidth - CHART_PADDING * 2;

  // Hardcoded data points for a simple line: (x, y)
  // These are conceptual points; we'll map them to Skia path commands
  const dataPoints = [
    { x: 0, y: 100 },
    { x: 50, y: 80 },
    { x: 100, y: 120 },
    { x: 150, y: 90 },
    { x: 200, y: 150 },
    { x: chartWidth, y: 50 }, // Ensure last point reaches the end
  ];

  // Create an Skia Path string from dataPoints
  // For simplicity, this example directly maps x to screen x, and y to screen y (inverted)
  // A real chart would involve scaling data to canvas dimensions.
  let pathString = `M ${dataPoints[0].x + CHART_PADDING} ${CHART_HEIGHT - dataPoints[0].y + CHART_PADDING}`;
  for (let i = 1; i < dataPoints.length; i++) {
    pathString += ` L ${dataPoints[i].x + CHART_PADDING} ${CHART_HEIGHT - dataPoints[i].y + CHART_PADDING}`;
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
    alignItems: 'center', // Center the canvas if its width is less than container
  },
}); 