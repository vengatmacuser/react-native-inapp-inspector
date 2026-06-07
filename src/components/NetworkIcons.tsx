import React from 'react';
import Svg, {Circle, Line, Path, Rect} from 'react-native-svg';

// Stylesheet
import {AppColors} from '../styles/AppColors';

export const EmptyRadarIcon = ({color = AppColors.purple, size = 32}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="11" r="3" stroke={color} strokeWidth="1.5" />
      <Path
        d="M12 14v3"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const MapPinIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="10"
        r="3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ScreenIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 8h18M8 20V8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ExpandCollapseIcon = ({
  isExpanded,
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isExpanded ? (
        <Path
          d="M4 14h6v6M20 10h-6V4M14 10l7-7M10 14l-7 7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <Path
          d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
};

export const SearchIcon = ({
  color = AppColors.primaryLight,
  size = 18,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Line
        x1="16.5"
        y1="16.5"
        x2="22"
        y2="22"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const ClearIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ClockIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line
        x1="12"
        y1="12"
        x2="12"
        y2="7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line
        x1="12"
        y1="12"
        x2="16"
        y2="14"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const CalendarIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="4"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
      <Line
        x1="3"
        y1="9"
        x2="21"
        y2="9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line
        x1="8"
        y1="2"
        x2="8"
        y2="6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Line
        x1="16"
        y1="2"
        x2="16"
        y2="6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const StatusIcon = ({color = AppColors.grayTextWeak}: any) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Line
        x1="12"
        y1="8"
        x2="12"
        y2="12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16" r="1" fill={color} />
    </Svg>
  );
};

export const SizeIcon = ({color = AppColors.grayTextWeak}: any) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 10h10M4 14h13M4 18h7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const RequestIcon = ({color = AppColors.offerPurple}: any) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12h14M13 6l6 6-6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ResponseIcon = ({color = AppColors.greenColor}: any) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M11 18l-6-6 6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const HeadersIcon = ({color = AppColors.skyBlue}: any) => {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 12h16M4 18h10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const CopyIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 9V5a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="3"
        y="7"
        width="10"
        height="14"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
};

export const FetchIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 9l3 3-3 3M13 15h3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke={color}
        strokeWidth="2"
      />
    </Svg>
  );
};

export const TerminalIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 17l6-6-6-6M12 19h8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const CheckIcon = ({color = AppColors.greenColor, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17l-5-5"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const FailIcon = ({color = AppColors.errorColor, size = 10}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const TrashIcon = ({color = AppColors.primaryLight, size = 18}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const HeaderPauseIcon = ({
  isPaused,
  color = AppColors.primaryLight,
  size = 20,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {isPaused ? (
        <Path d="M5 3l14 9-14 9V3z" fill={color} />
      ) : (
        <Path d="M6 5h3v14H6V5zm9 0h3v14h-3V5z" fill={color} />
      )}
    </Svg>
  );
};

export const ExportIcon = ({
  color = AppColors.primaryLight,
  size = 18,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const SignalIcon = ({
  color = AppColors.primaryLight,
  size = 18,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const DiffIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 8h10M12 3v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path d="M7 19h10" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

export const GlobeIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M12 2C8 7 8 17 12 22M12 2c4 5 4 15 0 20M2 12h20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const SortArrowIcon = ({
  color = AppColors.primaryLight,
  size = 20,
  direction = 'down',
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {direction === 'down' ? (
        <>
          <Path
            d="M4 6h10M4 12h7M4 18h4"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M18 6v12m0 0l-3-3m3 3l3-3"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      ) : (
        <>
          <Path
            d="M4 6h4M4 12h7M4 18h10"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <Path
            d="M18 18V6m0 0l-3 3m3-3l3 3"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </Svg>
  );
};

export const ChevronIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 9l6 6 6-6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const FilterIcon = ({
  color = AppColors.grayTextWeak,
  size = 18,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M7 12h10M10 18h4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const DownloadIcon = ({
  color = AppColors.primaryLight,
  size = 18,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const CloseWhite = ({color = '#FFFFFF', size = 20}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const WhiteBackNavigation = ({color = '#FFFFFF', size = 20}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19 12H5M12 19l-7-7 7-7"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const AnalyticsIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 20V10M12 20V4M6 20v-6"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const InsightsIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2 17l6-6 4 4 10-10M22 12V7h-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const DebugIcon = ({color = '#FFFFFF', size = 18}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Hammer: diagonal from bottom-left to top-right */}
      {/* Handle */}
      <Path
        d="M6 18l8-8"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Head */}
      <Path
        d="M13.5 10.5l2-2 1.5 1.5-2 2-1.5-1.5z"
        fill={color}
      />
      <Path
        d="M15.5 8.5L19 5c.5-.5 1.2-.5 1.7 0s.5 1.2 0 1.7L17.2 10.2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />

      {/* Screwdriver: diagonal from bottom-right to top-left */}
      {/* Handle */}
      <Path
        d="M15 15l4 4"
        stroke={color}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* Shaft */}
      <Path
        d="M15 15L8.5 8.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Flat tip */}
      <Path
        d="M9 9L5 5M4.5 6.5l2-2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const SunIcon = ({color = '#FFFFFF', size = 16}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth="2" />
      <Path
        d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const MoonIcon = ({color = '#FFFFFF', size = 16}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"
        fill={color}
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export { BrandCircleIcon } from './BrandCircleIcon';





