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
  size = 180,
  color = AppColors.primaryBlack,
  backgroundColor = AppColors.white,
}) => {
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const numCells = matrix.length;
  const cellSize = size / numCells;

  return (
    <View
      style={[
        styles.container,
        {
          width: size + 16,
          height: size + 16,
          backgroundColor,
        },
      ]}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <G>
          {matrix.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return null;
              return (
                <Rect
                  key={`${r}-${c}`}
                  x={c * cellSize}
                  y={r * cellSize}
                  width={cellSize + 0.2}
                  height={cellSize + 0.2}
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
    padding: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
});

export default QRCodeView;
