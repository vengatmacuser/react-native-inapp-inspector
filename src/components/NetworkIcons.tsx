import React from 'react';
import Svg, {Circle, Ellipse, Line, Path, Rect} from 'react-native-svg';

// Stylesheet
import {AppColors} from '../styles/AppColors';

export interface IconProps {
  color?: string;
  size?: number;
  strokeWidth?: number;
  isExpanded?: boolean;
  isPaused?: boolean;
  active?: boolean;
  direction?: 'up' | 'down' | string;
  ascending?: boolean;
}

export const EmptyRadarIcon = ({color = AppColors.purple, size = 32}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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

export const ClearIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
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

export const ClockIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
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
}: IconProps) => {
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

export const StatusIcon = ({color = AppColors.grayTextWeak}: IconProps) => {
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

export const SizeIcon = ({color = AppColors.grayTextWeak}: IconProps) => {
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

export const RequestIcon = ({color = AppColors.offerPurple}: IconProps) => {
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

export const ResponseIcon = ({color = AppColors.greenColor}: IconProps) => {
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

export const HeadersIcon = ({color = AppColors.skyBlue}: IconProps) => {
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

export const CopyIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
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

export const FetchIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
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
}: IconProps) => {
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

export const CheckIcon = ({color = AppColors.greenColor, size = 14}: IconProps) => {
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

export const CircleCheckIcon = ({color = AppColors.greenColor, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M8.5 12.5l2.5 2.5 5-5.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const CircleXIcon = ({color = AppColors.errorColor, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M9.5 9.5l5 5M14.5 9.5l-5 5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const CircleAlertIcon = ({color = AppColors.warningIconGold, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
      <Path
        d="M12 7.5v5.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="16.5" r="1.1" fill={color} />
    </Svg>
  );
};

export const FailIcon = ({color = AppColors.errorColor, size = 10}: IconProps) => {
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

export const TrashIcon = ({color = AppColors.primaryLight, size = 18}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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

export const DiffIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
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

export const GlobeIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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

export const CloseWhite = ({color = AppColors.white, size = 20}: IconProps) => {
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

export const WhiteBackNavigation = ({color = AppColors.white, size = 20}: IconProps) => {
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
}: IconProps) => {
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
}: IconProps) => {
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

export const DebugIcon = ({color = AppColors.white, size = 18}: IconProps) => {
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
      <Path d="M13.5 10.5l2-2 1.5 1.5-2 2-1.5-1.5z" fill={color} />
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

export const SunIcon = ({color = AppColors.white, size = 16}: IconProps) => {
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

export const MoonIcon = ({color = AppColors.white, size = 16}: IconProps) => {
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

export {BrandCircleIcon} from './BrandCircleIcon';
export {BrandSquareIcon} from './BrandSquareIcon';

export const HtmlIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.5 8.5L21 12l-3.5 3.5M6.5 8.5L3 12l3.5 3.5M14 4.5l-4 15"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const CssIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const JsIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="4"
        stroke={color}
        strokeWidth="2"
      />
      <Path
        d="M8 12v2.5a1.5 1.5 0 003 0V11M13 15.5a1 1 0 001.5.8h.5a1 1 0 001-1v-.5a1 1 0 00-1-1h-1a1 1 0 01-1-1v-.5a1 1 0 011-1h.5a1 1 0 011.5.8"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const EyeIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx="12"
        cy="12"
        r="3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const SettingsIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

export const FolderIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

// #3 — Broom/sweep "wipe" icon used by the header Clear-Everything button.
export const WipeIcon = ({color = AppColors.white, size = 16}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Handle */}
      <Path
        d="M19.5 3.5L12.7 10.3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Brush head */}
      <Path
        d="M13.5 9.5l1.5 1.5c.8.8.8 2 0 2.8L10 19l-5-5 5.2-5.5c.8-.8 2-.8 2.8 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Bristle strokes */}
      <Path
        d="M7.5 16.5L5.5 18.5M10 19l-1.5 1.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Dust sparks */}
      <Path
        d="M3 11.5h.01M5.5 8.5h.01"
        stroke={color}
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </Svg>
  );
};

// #7 — Icons for the inner filter chips / sub tabs.
export const LayersIcon = ({
  color = AppColors.grayTextWeak,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const UserIcon = ({color = AppColors.grayTextWeak, size = 12}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

export const InfoCircleIcon = ({
  color = AppColors.grayTextWeak,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M12 16v-4M12 8h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const WarningTriangleIcon = ({
  color = AppColors.grayTextWeak,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9v4M12 17h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const ErrorCircleIcon = ({
  color = AppColors.grayTextWeak,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M15 9l-6 6M9 9l6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const TrendingUpIcon = ({
  color = AppColors.grayTextWeak,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 6l-9.5 9.5-5-5L1 18"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 6h6v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const MotionIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3l14 9-14 9V3z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const SortIcon = ({
  ascending,
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 4l-6 6h12z"
        fill={ascending ? color : AppColors.grayTextWeak}
      />
      <Path
        d="M12 20l6-6H6z"
        fill={!ascending ? color : AppColors.grayTextWeak}
      />
    </Svg>
  );
};

export const PrettyIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const RawIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="21" y1="6" x2="3" y2="6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="21" y1="12" x2="3" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="17" y1="18" x2="3" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
};

export const TableIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="1.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
};

export const PackageIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 .86 1.52l8.95 5.16a1.78 1.78 0 0 0 1.78 0l8.95-5.16a1.78 1.78 0 0 0 .86-1.52V5.79a1.78 1.78 0 0 0-2.5-1.55L16.5 9.4z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.29 7 12 12.01 20.71 7M12 22.08V12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const ForwardChevronIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 18l6-6-6-6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const BundleIcon = PackageIcon;

export const LiveStateIcon = ({
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" strokeDasharray="3 3" opacity={0.6} />
      <Circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const TimelineIcon = ({
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M6 3v18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="6" cy="6" r="2.5" stroke={color} strokeWidth="1.8" fill={`${color}25`} />
      <Path d="M6 12h5a3 3 0 0 0 3-3V6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="14" cy="6" r="2.5" stroke={color} strokeWidth="1.8" fill={color} />
      <Circle cx="6" cy="18" r="2.5" stroke={color} strokeWidth="1.8" fill={color} />
      <Path d="M6 18h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="17" cy="18" r="2.5" stroke={color} strokeWidth="1.8" fill={`${color}25`} />
    </Svg>
  );
};

export const RefreshCcwIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const StorageIcon = ({
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="5" rx="8" ry="2.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M4 5v4.5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M4 9.5v4.5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-4.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M4 14v4.5c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5V14"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const MetadataIcon = ({
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8" />
      <Path d="M7 8h10M7 12h6M7 16h7" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Circle cx="16.5" cy="12" r="1.5" fill={color} />
      <Circle cx="16.5" cy="16" r="1.5" fill={color} />
    </Svg>
  );
};

export const ReduxIcon = ({
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 3a9 9 0 0 1 9 9M12 21a9 9 0 0 1-9-9"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Circle cx="21" cy="12" r="1.5" fill={color} />
      <Circle cx="3" cy="12" r="1.5" fill={color} />
    </Svg>
  );
};

export const PerformanceIcon = ({
  color = AppColors.purple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v2M5.636 5.636l1.414 1.414M18.364 5.636l-1.414 1.414M3 12h2M19 12h2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 19a7 7 0 1 0-7-7c0 1.93.784 3.68 2.05 4.95"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 12l3.5-3.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
};

// ─── App-wide Vector Icons (emoji-free, render on every device) ─────────────

export const BoltIcon = ({color = AppColors.amber500, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 2 4.5 13.5 H10.5 L9 22 19.5 9.5 H13.5 Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const BanIcon = ({color = AppColors.errorColor, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <Path d="M5.5 5.5 18.5 18.5" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const FolderOpenIcon = ({color = AppColors.amber500, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.4 11 10 5.5a2 2 0 0 1 1.9-1.5h3.7a1.5 1.5 0 0 1 1.4 2L15.5 11"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path
        d="M6.7 20.4 4.3 12.9A1.6 1.6 0 0 1 5.8 11h14.6a1.6 1.6 0 0 1 1.6 1.9l-2.4 7.5a2 2 0 0 1-2 1.4H8.7a2 2 0 0 1-2-1.4Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const DocIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M14 2v4a2 2 0 0 0 2 2h4" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M8 13h8 M8 17h8" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const LightbulbIcon = ({color = AppColors.amber500, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1.3.5 2.6 1.5 3.5.8.8 1.3 1.5 1.5 2.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M9 18h6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M10 22h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const SparkleIcon = ({color = AppColors.amber500, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M11.1 3.9c.2-.6 1-.6 1.2 0l1.2 4.2 4.2 1.2c.6.2.6 1 0 1.2l-4.2 1.2-1.2 4.2c-.2.6-1 .6-1.2 0l-1.2-4.2-4.2-1.2c-.6-.2-.6-1 0-1.2l4.2-1.2Z"
        fill={color}
      />
      <Path d="M18.5 3.5v4 M16.5 5.5h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const MapIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 5.5 9 3.5l6 2 6-2v15l-6 2-6-2-6 2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <Path d="M9 3.5v15M15 5.5v15" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="11" r="1.9" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
};

export const AtomIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="12" rx="9" ry="3.8" stroke={color} strokeWidth="1.6" />
      <Ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.8"
        stroke={color}
        strokeWidth="1.6"
        transform="rotate(60 12 12)"
      />
      <Ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3.8"
        stroke={color}
        strokeWidth="1.6"
        transform="rotate(120 12 12)"
      />
      <Circle cx="12" cy="12" r="1.6" fill={color} />
    </Svg>
  );
};

export const BrainIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9.5 2a2.5 2.5 0 0 0-2.5 2.5v.5a2.5 2.5 0 0 0-3 3.17A2.5 2.5 0 0 0 2 10.5c0 .76.34 1.44.88 1.9A2.5 2.5 0 0 0 2 15.5c0 .76.34 1.44.88 1.9A2.5 2.5 0 0 0 5 19.75c0 .75.5 1.5 1.25 1.75A2.5 2.5 0 0 0 8.5 23h.25a2.5 2.5 0 0 0 2.5-2.5V4a2.5 2.5 0 0 0-1.75-2ZM14.5 2a2.5 2.5 0 0 1 2.5 2.5v.5a2.5 2.5 0 0 1 3 3.17A2.5 2.5 0 0 1 22 10.5c0 .76-.34 1.44-.88 1.9a2.5 2.5 0 0 1 .88 1.9c0 .76-.34 1.44-.88 1.9A2.5 2.5 0 0 1 19 19.75c0 .75-.5 1.5-1.25 1.75A2.5 2.5 0 0 1 15.5 23h-.25a2.5 2.5 0 0 1-2.5-2.5V4a2.5 2.5 0 0 1 1.75-2Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const TextAaIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 19 7.5 7 11 19" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M5.5 15h4" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M16 19l1.7-6.6 1.7 6.6" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <Path d="M16.9 15.8h1.6" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const CartIcon = ({color = AppColors.amber500, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9.5" cy="20" r="1.3" stroke={color} strokeWidth="1.8" />
      <Circle cx="18.5" cy="20" r="1.3" stroke={color} strokeWidth="1.8" />
      <Path
        d="M3 3.5h1.8a1 1 0 0 1 .97.75l3.1 9.75a1.5 1.5 0 0 0 1.44 1.1h9.2a1 1 0 0 0 .95-.7l2.5-7.5a.8.8 0 0 0-.75-1.05H7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const MoneyIcon = ({color = AppColors.emerald500, size = 14}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 7v10M14.5 9.5c-.6-1-1.5-1.5-2.5-1.5-1.5 0-2.5.9-2.5 2s1 1.8 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1 0-1.9-.5-2.5-1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const ExternalLinkIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 3h6v6M10 14L21 3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const PackageBoxIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.27 6.96L12 12.01l8.73-5.05M12 22.08V12"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const GitHubIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const LinkChainIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const AppleIcon = ({
  color = AppColors.white,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.9.04-1.99.6-2.63 1.35-.56.65-1.06 1.71-.93 2.74 1.01.08 2.03-.47 2.64-1.22z" />
    </Svg>
  );
};

export const AndroidIcon = ({
  color = AppColors.white,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h2v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v6c0 .83.67 1.5 1.5 1.5S5 16.33 5 15.5v-6C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v6c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-6c0-.83-.67-1.5-1.5-1.5zm-4.97-4.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.85 2.23 12.95 2 12 2c-.96 0-1.86.23-2.66.63L7.85 1.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.31 1.31C6.73 4.26 5.54 6 5.16 8h13.68c-.38-2-1.57-3.74-3.31-4.84zM9 6c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" />
    </Svg>
  );
};

export const CodeBracketsIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 18l6-6-6-6M8 6l-6 6 6 6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const FlameIcon = ({
  color = AppColors.darkOrange,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 3z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const HourglassIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 22h14M5 2h14M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const PinIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s-6-5.333-6-10a6 6 0 0 1 12 0c0 4.667-6 10-6 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="11" r="2" fill={color} />
    </Svg>
  );
};

export const RepeatIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 2l4 4-4 4M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4M21 13v1a4 4 0 0 1-4 4H3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const TargetGoalIcon = ({
  color = AppColors.brandPurple,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="1.8" />
      <Circle cx="12" cy="12" r="2" fill={color} />
    </Svg>
  );
};

export const UserCheckIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="1.8" />
      <Path
        d="M16 11l2 2 4-4"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const CrashIcon = ({
  color = AppColors.errorColor,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Bug / Crash Hybrid Icon */}
      <Path
        d="M12 2v3M4.93 4.93l2.12 2.12M19.07 4.93l-2.12 2.12M9 10h6M8 14h8M9 18h6"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M12 8a6 6 0 0 1 6 6v3a6 6 0 0 1-12 0v-3a6 6 0 0 1 6-6z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 13h3M18 13h3M4 19l2.5-1.5M20 19l-2.5-1.5M4 9l2.5 1.5M20 9l-2.5 1.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const ShieldAlertIcon = ({
  color = AppColors.errorColor,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
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



export const SkullIcon = ({
  color = AppColors.errorColor,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.8" />
      <Circle cx="9" cy="11" r="1.6" fill={color} />
      <Circle cx="15" cy="11" r="1.6" fill={color} />
      <Path
        d="M8 16c1.2 1 3.2 1.2 4 1.2.8 0 2.8-.2 4-1.2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Line x1="12" y1="16" x2="12" y2="18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
};

export const ChipIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="7" y="7" width="10" height="10" rx="2" stroke={color} strokeWidth="1.8" />
      <Rect x="10" y="10" width="4" height="4" fill={color} />
      <Line x1="9" y1="3" x2="9" y2="7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="15" y1="3" x2="15" y2="7" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="9" y1="17" x2="9" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="15" y1="17" x2="15" y2="21" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="3" y1="9" x2="7" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="3" y1="15" x2="7" y2="15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="17" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <Line x1="17" y1="15" x2="21" y2="15" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
};

export const LayoutIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth="1.8" />
      <Line x1="3" y1="9" x2="21" y2="9" stroke={color} strokeWidth="1.8" />
      <Line x1="9" y1="9" x2="9" y2="21" stroke={color} strokeWidth="1.8" />
      <Rect x="12" y="12" width="6" height="6" fill={color} />
    </Svg>
  );
};

export const StackTraceIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 10h11M4 14h16M4 18h9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M7.5 12.5 4 14l3.5 1.5"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const DiagnosticsIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 12h3l2-5 3 9 2-6 1.5 2H21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="4" y1="19" x2="20" y2="19" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </Svg>
  );
};

export const TrailIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="5" cy="18" r="2" fill={color} />
      <Circle cx="12" cy="12" r="2" fill={color} />
      <Circle cx="19" cy="6" r="2" fill={color} />
      <Path
        d="M6.5 16.5 10.5 13.5M13.5 10.5 17.5 7.5"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const RawJsonIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 3c-2 1-3 2.5-3 5 0 2-1 3.5-2 4 1 .5 2 2 2 4 0 2.5 1 4 3 5M16 3c2 1 3 2.5 3 5 0 2 1 3.5 2 4-1 .5-2 2-2 4 0 2.5-1 4-3 5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const AppFramesIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 6h16M4 10h11M4 14h16M4 18h9"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M18 12.5l2 2 3-3.5"
        stroke="#059669"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const AllFramesIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 4h16M4 8h16M4 12h16M4 16h16M4 20h10"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Rect x="16" y="16" width="4" height="4" rx="1" fill={color} />
    </Svg>
  );
};

export const ListenerIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 18v-6a9 9 0 0 1 18 0v6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Path
        d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3v5zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3v5z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const LoadingSpinnerIcon = ({
  color = AppColors.amber800Warm,
  size = 12,
}: IconProps) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const FlaskIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M10 2v5.5L4.4 18.2A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.8-2.8L14 7.5V2M8.5 2h7M7 15h10"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="12" cy="18" r="1" fill={color} />
  </Svg>
);

export const ZapIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DiceIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="4" stroke={color} strokeWidth="1.8" />
    <Circle cx="8.5" cy="8.5" r="1.5" fill={color} />
    <Circle cx="15.5" cy="8.5" r="1.5" fill={color} />
    <Circle cx="12" cy="12" r="1.5" fill={color} />
    <Circle cx="8.5" cy="15.5" r="1.5" fill={color} />
    <Circle cx="15.5" cy="15.5" r="1.5" fill={color} />
  </Svg>
);

export const BarChartIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 20V10M12 20V4M6 20v-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const KeyIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="7.5" cy="15.5" r="4.5" stroke={color} strokeWidth="1.8" />
    <Path
      d="m11 12 8.5-8.5M16 4.5l3 3M19 7.5l2-2"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SmartphoneIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="5" y="2" width="14" height="20" rx="3" stroke={color} strokeWidth="1.8" />
    <Path d="M12 18h.01" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
  </Svg>
);

export const AlertTriangleIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12 9v4M12 17h.01" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const BugIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect width="8" height="12" x="8" y="8" rx="4" stroke={color} strokeWidth="1.8" />
    <Path
      d="m19 7-3 2M5 7l3 2M19 19l-3-2M5 19l3-2M20 13h-4M4 13h4M10 4l2 2 2-2"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TagIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8 8a2 2 0 0 0 2.828 0l7.172-7.172a2 2 0 0 0 0-2.828l-8-8z"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="7.5" cy="7.5" r="1.5" fill={color} />
  </Svg>
);

export const NpmIcon = ({color = '#CB3837', size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
    <Rect width="256" height="256" rx="32" fill={color} />
    <Path d="M48 48h160v160h-32V96h-32v112H48V48z" fill="#FFFFFF" />
  </Svg>
);

export const ResetIcon = ({color = AppColors.white, size = 16}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 3v5h5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const ChevronDownIcon = ({color = AppColors.grayTextWeak, size = 14}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M6 9l6 6 6-6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const CpuIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="4" y="4" width="16" height="16" rx="2" stroke={color} strokeWidth="2" />
    <Rect x="9" y="9" width="6" height="6" stroke={color} strokeWidth="2" />
    <Path
      d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 14h3M1 9h3M1 14h3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const WifiIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const ShieldCheckIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9 12l2 2 4-4"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const DatabaseIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Ellipse cx="12" cy="5" rx="9" ry="3" stroke={color} strokeWidth="2" />
    <Path
      d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <Path
      d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </Svg>
);

export const PencilIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PlusIcon = ({
  color = AppColors.grayTextWeak,
  size = 14,
}: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 5v14M5 12h14"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

