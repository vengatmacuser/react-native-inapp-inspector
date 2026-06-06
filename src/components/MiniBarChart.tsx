import React from 'react';
import Svg, {Rect} from 'react-native-svg';

const MiniBarChart = ({
  data,
  color,
  maxVal,
}: {
  data: number[];
  color: string;
  maxVal?: number;
}) => {
  if (!data || data.length === 0) return <Svg width={40} height={16} />;
  const max = maxVal || Math.max(...data, 1);
  const paddedData =
    data.length < 10
      ? [...Array(10 - data.length).fill(0), ...data]
      : data.slice(-10);

  return (
    <Svg width={40} height={16} viewBox="0 0 40 16">
      {paddedData.map((val, i) => {
        const h = Math.max((val / max) * 16, 2);
        const opacity = val === 0 && maxVal === 1 ? 0.2 : 1;
        return (
          <Rect
            key={i}
            x={i * 4}
            y={16 - h}
            width={2.5}
            height={h}
            fill={color}
            rx={1}
            opacity={opacity}
          />
        );
      })}
    </Svg>
  );
};

export default MiniBarChart;
