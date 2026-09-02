import React, {useMemo} from 'react';
import {View, StyleSheet} from 'react-native';
import Svg, {Rect, G} from 'react-native-svg';
import {generateQRMatrix} from '../helpers/qrGenerator';
import {AppColors} from '../styles/AppColors';

interface QRCodeViewProps {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 200,
  color = '#000000',
  backgroundColor = '#FFFFFF',
}) => {
  const matrix = useMemo(() => generateQRMatrix(value || 'http://localhost:8081'), [value]);
  const numCells = matrix.length || 21;
  // Standard 4-module quiet zone (white border) for 100% instant phone camera / Google Lens recognition
  const margin = 4;
  const totalCells = numCells + margin * 2;
  const cellSize = size / totalCells;

  return (
    <View
      style={[
        styles.container,
        {
          width: size + 20,
          height: size + 20,
          backgroundColor,
        },
      ]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Rect width={size} height={size} fill={backgroundColor} />
        <G>
          {matrix.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              return (
                <Rect
                  key={`${r}-${c}`}
                  x={(c + margin) * cellSize}
                  y={(r + margin) * cellSize}
                  width={cellSize + 0.3}
                  height={cellSize + 0.3}
                  fill={color}
                />
              );
            }),
          )}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
});

export default QRCodeView;
