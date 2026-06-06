import React from 'react';
import {View, Text, ScrollView, Dimensions, StyleSheet} from 'react-native';
import Svg, {
  Rect,
  Text as SvgText,
  Line,
  Circle,
  Path,
  Defs,
  LinearGradient,
  Stop,
} from 'react-native-svg';
import {AppColors} from '../styles/AppColors';
import {AppFonts} from '../styles/AppFonts';
import {AnalyticsEvent} from '../types';

interface Props {
  event: AnalyticsEvent;
  accentColor: string;
}

const BAR_HEIGHT = 24;
const PADDING_Y = 12;

const AnalyticsGraph = ({event, accentColor}: Props) => {
  const params = event.params || {};

  // 1. Check for E-commerce items array
  const itemsArray = Array.isArray(params.items) ? params.items : null;
  const filteredItems =
    itemsArray?.filter((item: any) => typeof item.price === 'number') || [];

  // 2. Discover root-level numeric fields (exclude ids)
  const rootNumericKeys: {key: string; value: number}[] = [];
  Object.entries(params).forEach(([k, v]) => {
    if (
      typeof v === 'number' &&
      !k.toLowerCase().includes('id') &&
      !k.toLowerCase().includes('timestamp')
    ) {
      rootNumericKeys.push({key: k, value: v});
    }
  });

  // 3. Discover dates (YYYY-MM-DD format commonly used in booking/flights)
  const dateKeys: {key: string; date: Date}[] = [];
  Object.entries(params).forEach(([k, v]) => {
    if (
      typeof v === 'string' &&
      v.length >= 10 &&
      /^\d{4}-\d{2}-\d{2}/.test(v)
    ) {
      const d = new Date(v);
      if (!isNaN(d.getTime())) {
        dateKeys.push({key: k, date: d});
      }
    }
  });

  // 4. Calculate parameter types
  const paramTypes = {string: 0, number: 0, boolean: 0, object: 0};
  const strings: {label: string; value: number}[] = [];

  Object.entries(params).forEach(([k, v]) => {
    const t = typeof v;
    if (t === 'string') {
      paramTypes.string++;
      strings.push({label: k, value: (v as string).length});
    } else if (t === 'number') {
      paramTypes.number++;
    } else if (t === 'boolean') {
      paramTypes.boolean++;
    } else if (t === 'object' && v !== null) {
      paramTypes.object++;
    }
  });

  const typeData = [
    {label: 'Strings', value: paramTypes.string, color: AppColors.purple},
    {label: 'Numbers', value: paramTypes.number, color: AppColors.skyBlue},
    {label: 'Booleans', value: paramTypes.boolean, color: '#F59E0B'}, // Amber
    {label: 'Objects', value: paramTypes.object, color: AppColors.greenColor},
  ].filter(d => d.value > 0);

  strings.sort((a, b) => b.value - a.value);
  const topStrings = strings.slice(0, 5);

  const hasItemsChart = filteredItems.length > 0;
  const hasRootNumericChart = rootNumericKeys.length > 0;
  const hasDatesChart = dateKeys.length > 0;
  const hasStringsChart = topStrings.length > 0;
  const hasTypeData = typeData.length > 0;

  const screenWidth = Dimensions.get('window').width - 60; // Padding adjustments
  const rightMargin = 40; // Space for labels at the end of the bar
  const maxBarWidth = screenWidth - rightMargin;

  return (
    <View style={graphStyles.container}>
      <Text style={graphStyles.headerTitle}>Data Visualization</Text>

      {hasTypeData && (
        <View style={graphStyles.chartBlock}>
          <Text style={graphStyles.chartTitle}>Data Types Breakdown</Text>
          <DonutChart data={typeData} />
        </View>
      )}

      {hasStringsChart && (
        <View style={graphStyles.chartBlock}>
          <Text style={graphStyles.chartTitle}>Highest Payload Strings</Text>
          <BarChart
            data={topStrings}
            accentColor={AppColors.purple}
            maxBarWidth={maxBarWidth}
            isGradient
          />
        </View>
      )}

      {hasRootNumericChart && (
        <View style={graphStyles.chartBlock}>
          <Text style={graphStyles.chartTitle}>Top-Level Metrics</Text>
          <GaugeChart
            data={rootNumericKeys.map(d => ({label: d.key, value: d.value}))}
            accentColor={accentColor}
          />
        </View>
      )}

      {hasDatesChart && (
        <View style={graphStyles.chartBlock}>
          <Text style={graphStyles.chartTitle}>Important Dates</Text>
          <CalendarChart
            data={dateKeys.map(d => ({label: d.key, date: d.date}))}
            accentColor={accentColor}
          />
        </View>
      )}

      {hasItemsChart && (
        <View style={graphStyles.chartBlock}>
          <Text style={graphStyles.chartTitle}>Item Prices</Text>
          <BarChart
            data={filteredItems.map((item: any, i) => ({
              label: item.item_name || item.item_id || `Item ${i + 1}`,
              value: item.price,
            }))}
            accentColor={AppColors.successGreen || '#22C55E'}
            maxBarWidth={maxBarWidth}
            isGradient={false}
          />
        </View>
      )}
    </View>
  );
};

// --- Donut Chart Helpers ---
const polarToCartesian = (
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number,
) => {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
};

const getPiePath = (
  x: number,
  y: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
) => {
  const start = polarToCartesian(x, y, radius, endAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const startInner = polarToCartesian(x, y, innerRadius, endAngle);
  const endInner = polarToCartesian(x, y, innerRadius, startAngle);
  const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';

  return `
    M ${start.x} ${start.y}
    A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}
    L ${endInner.x} ${endInner.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}
    Z
  `;
};

const DonutChart = ({
  data,
}: {
  data: {label: string; value: number; color: string}[];
}) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return null;

  let currentAngle = 0;
  const radius = 50;
  const innerRadius = 30;
  const center = 60;

  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Svg width="120" height="120" viewBox="0 0 120 120">
        {data.map((d, i) => {
          if (d.value === 0) return null;
          const angle = (d.value / total) * 360;
          const startAngle = currentAngle;
          const endAngle = currentAngle + angle;
          currentAngle += angle;

          if (angle === 360) {
            return (
              <React.Fragment key={i}>
                <Circle cx={center} cy={center} r={radius} fill={d.color} />
                <Circle
                  cx={center}
                  cy={center}
                  r={innerRadius}
                  fill={AppColors.primaryLight}
                />
              </React.Fragment>
            );
          }

          const path = getPiePath(
            center,
            center,
            radius,
            innerRadius,
            startAngle,
            endAngle,
          );
          return <Path key={i} d={path} fill={d.color} />;
        })}
      </Svg>
      <View style={{marginLeft: 16, flex: 1, gap: 6}}>
        {data.map((d, i) => {
          if (d.value === 0) return null;
          return (
            <View
              key={i}
              style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: d.color,
                }}
              />
              <Text
                style={{
                  fontFamily: AppFonts.interMedium,
                  fontSize: 11,
                  color: AppColors.grayTextStrong,
                }}>
                {d.label} ({d.value})
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const GaugeChart = ({
  data,
  accentColor,
}: {
  data: {label: string; value: number}[];
  accentColor: string;
}) => {
  const maxVal = Math.max(...data.map(d => Math.abs(d.value)), 1);
  const radius = 26;
  const stroke = 5;
  const circumference = 2 * Math.PI * radius;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 16,
        paddingRight: 16,
        paddingTop: 6,
        paddingBottom: 6,
      }}>
      {data.map((d, i) => {
        const fillPct = Math.min(Math.abs(d.value) / maxVal, 1);
        const strokeDashoffset = Math.max(
          circumference - fillPct * circumference,
          0.001,
        ); // avoid exact 0

        return (
          <View key={d.label} style={{alignItems: 'center', width: 70}}>
            <Svg width="60" height="60" viewBox="0 0 60 60">
              <Circle
                cx="30"
                cy="30"
                r={radius}
                stroke="#F3F4F6"
                strokeWidth={stroke}
                fill="none"
              />
              <Circle
                cx="30"
                cy="30"
                r={radius}
                stroke={accentColor}
                strokeWidth={stroke}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                rotation="-90"
                origin="30, 30"
              />
            </Svg>
            <View
              style={{
                position: 'absolute',
                top: 20,
                height: 20,
                width: 60,
                justifyContent: 'center',
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontFamily: AppFonts.interBold,
                  fontSize: 13,
                  color: AppColors.primaryBlack,
                  textAlign: 'center',
                }}>
                {d.value >= 1000 ? (d.value / 1000).toFixed(1) + 'k' : d.value}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: AppFonts.interMedium,
                fontSize: 10,
                color: AppColors.grayTextWeak,
                marginTop: 6,
                textAlign: 'center',
              }}
              numberOfLines={1}>
              {d.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const CalendarChart = ({
  data,
  accentColor,
}: {
  data: {label: string; date: Date}[];
  accentColor: string;
}) => {
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{
        gap: 16,
        paddingRight: 16,
        paddingTop: 6,
        paddingBottom: 6,
      }}>
      {data.map((d, i) => {
        const monthText = months[d.date.getMonth()];
        const dayText = d.date.getDate();
        const yearText = d.date.getFullYear();

        return (
          <View key={d.label + i} style={{width: 70, alignItems: 'center'}}>
            <View
              style={{
                width: 58,
                height: 62,
                backgroundColor: '#FFFFFF',
                borderRadius: 8,
                borderWidth: 1,
                borderColor: AppColors.grayBorderSecondary,
                overflow: 'hidden',
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 4,
                shadowOffset: {width: 0, height: 2},
                elevation: 2,
              }}>
              {/* Calendar Header with Accent Color */}
              <View
                style={{
                  backgroundColor: accentColor,
                  height: 18,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 9,
                    color: '#FFF',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}>
                  {monthText} {yearText}
                </Text>
              </View>
              {/* Calendar Body */}
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: '#FAFAFA',
                }}>
                <Text
                  style={{
                    fontFamily: AppFonts.interBold,
                    fontSize: 24,
                    color: AppColors.primaryBlack,
                  }}>
                  {dayText}
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontFamily: AppFonts.interMedium,
                fontSize: 10,
                color: AppColors.grayTextWeak,
                marginTop: 8,
                textAlign: 'center',
              }}
              numberOfLines={2}>
              {d.label.replace(/_/g, ' ')}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
};

const BarChart = ({
  data,
  accentColor,
  maxBarWidth,
  isGradient = false,
}: {
  data: {label: string; value: number}[];
  accentColor: string;
  maxBarWidth: number;
  isGradient?: boolean;
}) => {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartHeight = data.length * (BAR_HEIGHT + PADDING_Y) + 10;

  return (
    <View style={graphStyles.svgContainer}>
      <Svg width="100%" height={chartHeight}>
        <Defs>
          <LinearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={accentColor} stopOpacity="0.6" />
            <Stop offset="1" stopColor={accentColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>
        {data.map((d, i) => {
          const y = i * (BAR_HEIGHT + PADDING_Y);
          const barWidth = Math.max((d.value / maxVal) * maxBarWidth, 2);

          return (
            <React.Fragment key={d.label}>
              {/* Label above bar */}
              <SvgText
                x={0}
                y={y + 12}
                fill={AppColors.grayTextStrong}
                fontSize="11"
                fontFamily={AppFonts.interMedium}>
                {d.label}
              </SvgText>

              {/* Background trace line */}
              <Line
                x1={0}
                y1={y + 24}
                x2={maxBarWidth}
                y2={y + 24}
                stroke={AppColors.grayBorderSecondary}
                strokeDasharray="4"
              />

              {/* The actual Bar */}
              <Rect
                x={0}
                y={y + 16}
                width={barWidth}
                height={14}
                fill={isGradient ? 'url(#barGrad)' : accentColor}
                rx={4}
                opacity={0.85}
              />

              {/* Value Text at the end of the bar */}
              <SvgText
                x={barWidth + 6}
                y={y + 26}
                fill={AppColors.primaryBlack}
                fontSize="11"
                fontFamily={AppFonts.interBold}>
                {d.value}
              </SvgText>
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
};

const graphStyles = StyleSheet.create({
  container: {
    backgroundColor: AppColors.primaryLight,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
    overflow: 'hidden',
  },
  headerTitle: {
    fontFamily: AppFonts.interBold,
    color: AppColors.primaryBlack,
    fontSize: 14,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.dividerColor,
    paddingBottom: 8,
  },
  chartBlock: {
    marginBottom: 16,
  },
  chartTitle: {
    fontFamily: AppFonts.interMedium,
    color: AppColors.grayTextWeak,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  svgContainer: {
    marginTop: 4,
  },
});

export default AnalyticsGraph;
