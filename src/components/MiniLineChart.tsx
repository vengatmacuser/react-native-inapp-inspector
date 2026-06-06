import React from 'react';
import Svg, {Path} from 'react-native-svg';

const MiniLineChart = ({data, color}: {data: number[]; color: string}) => {
  if (!data || data.length === 0) return <Svg width={40} height={16} />;

  const paddedData =
    data.length < 10
      ? [...Array(10 - data.length).fill(data[0] || 0), ...data]
      : data.slice(-10);
  const max = Math.max(...paddedData, 1);
  const min = Math.min(...paddedData, 0);
  const range = max - min || 1;
  const dx = 40 / 9;
  const points = paddedData
    .map((d, i) => `${i * dx},${14 - ((d - min) / range) * 12}`)
    .join(' L ');

  return (
    <Svg width={40} height={16} viewBox="0 0 40 16">
      <Path
        d={`M ${points}`}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default MiniLineChart;
