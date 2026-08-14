import React from 'react';
import Svg, {Circle, Ellipse, Line, Path, Rect} from 'react-native-svg';

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

export const CircleCheckIcon = ({color = AppColors.greenColor, size = 14}: any) => {
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

export const CircleXIcon = ({color = AppColors.errorColor, size = 14}: any) => {
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

export const CircleAlertIcon = ({color = AppColors.warningIconGold, size = 14}: any) => {
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

export const CloseWhite = ({color = AppColors.white, size = 20}: any) => {
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

export const WhiteBackNavigation = ({color = AppColors.white, size = 20}: any) => {
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

export const DebugIcon = ({color = AppColors.white, size = 18}: any) => {
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

export const SunIcon = ({color = AppColors.white, size = 16}: any) => {
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

export const MoonIcon = ({color = AppColors.white, size = 16}: any) => {
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

export const HtmlIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
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

export const CssIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
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

export const JsIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
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

export const EyeIcon = ({color = AppColors.grayTextWeak, size = 14}: any) => {
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
}: any) => {
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
}: any) => {
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
export const WipeIcon = ({color = AppColors.white, size = 16}: any) => {
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
}: any) => {
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

export const UserIcon = ({color = AppColors.grayTextWeak, size = 12}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
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
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3v3M12 18v3M3 12h3M18 12h3"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="12" r="3.5" stroke={color} strokeWidth="1.8" fill={`${color}22`} />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
    </Svg>
  );
};

export const TimelineIcon = ({
  color = AppColors.purple,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 7.5v4.5l3 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export const StorageIcon = ({
  color = AppColors.purple,
  size = 14,
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Ellipse cx="12" cy="6" rx="8" ry="2.8" stroke={color} strokeWidth="1.8" />
      <Path
        d="M20 12c0 1.55-3.58 2.8-8 2.8s-8-1.25-8-2.8"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <Path
        d="M4 6v12c0 1.55 3.58 2.8 8 2.8s8-1.25 8-2.8V6"
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
}: any) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth="1.8" />
      <Path
        d="M12 16v-4M12 8.2h.01"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  );
};

export const ReduxIcon = ({
  color = AppColors.purple,
  size = 14,
}: any) => {
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
}: any) => {
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

