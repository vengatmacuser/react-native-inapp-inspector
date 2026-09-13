import React from 'react';
import {View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import Svg, {
  Circle,
  G,
  Path,
  Polygon,
  Rect,
  ClipPath,
  Defs,
} from 'react-native-svg';
import {AppColors} from '../styles/AppColors';

export interface CountryFlagProps {
  code: string;
  size?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Standardized Vector SVG Country Flag Component.
 * Bypasses Android OS missing emoji glyphs / '?' question mark issues.
 */
export const CountryFlag: React.FC<CountryFlagProps> = ({
  code,
  size = 18,
  borderRadius = 3,
  style,
}) => {
  const width = size * 1.35;
  const height = size;
  const normalized = (code || '').toLowerCase().trim();

  const renderFlagContent = () => {
    switch (normalized) {
      case 'us':
      case 'en':
        return (
          <G>
            {/* White base */}
            <Rect width="24" height="18" fill="#FFFFFF" />
            {/* Red stripes */}
            <Rect y="0" width="24" height="1.38" fill="#B22234" />
            <Rect y="2.76" width="24" height="1.38" fill="#B22234" />
            <Rect y="5.52" width="24" height="1.38" fill="#B22234" />
            <Rect y="8.28" width="24" height="1.38" fill="#B22234" />
            <Rect y="11.04" width="24" height="1.38" fill="#B22234" />
            <Rect y="13.8" width="24" height="1.38" fill="#B22234" />
            <Rect y="16.56" width="24" height="1.44" fill="#B22234" />
            {/* Canton */}
            <Rect width="10" height="9.69" fill="#3C3B6E" />
            {/* Canton Stars representation */}
            <Circle cx="2.5" cy="2.5" r="0.75" fill="#FFFFFF" />
            <Circle cx="5.0" cy="2.5" r="0.75" fill="#FFFFFF" />
            <Circle cx="7.5" cy="2.5" r="0.75" fill="#FFFFFF" />
            <Circle cx="3.75" cy="4.85" r="0.75" fill="#FFFFFF" />
            <Circle cx="6.25" cy="4.85" r="0.75" fill="#FFFFFF" />
            <Circle cx="2.5" cy="7.2" r="0.75" fill="#FFFFFF" />
            <Circle cx="5.0" cy="7.2" r="0.75" fill="#FFFFFF" />
            <Circle cx="7.5" cy="7.2" r="0.75" fill="#FFFFFF" />
          </G>
        );

      case 'in':
      case 'hi':
      case 'ta':
      case 'te':
      case 'kn':
      case 'ml':
      case 'bn':
      case 'mr':
      case 'gu':
      case 'pa':
        return (
          <G>
            {/* Saffron */}
            <Rect y="0" width="24" height="6" fill="#FF9933" />
            {/* White */}
            <Rect y="6" width="24" height="6" fill="#FFFFFF" />
            {/* Green */}
            <Rect y="12" width="24" height="6" fill="#138808" />
            {/* Ashoka Chakra */}
            <Circle cx="12" cy="9" r="2.2" stroke="#000080" strokeWidth="0.5" fill="none" />
            <Circle cx="12" cy="9" r="0.6" fill="#000080" />
            <Path
              d="M12 6.8v4.4M9.8 9h4.4M10.4 7.4l3.2 3.2M10.4 10.6l3.2-3.2"
              stroke="#000080"
              strokeWidth="0.35"
            />
          </G>
        );

      case 'gb':
      case 'uk':
        return (
          <G>
            <Rect width="24" height="18" fill="#012169" />
            {/* Diagonal white */}
            <Path d="M0 0L24 18M24 0L0 18" stroke="#FFFFFF" strokeWidth="3.2" />
            {/* Diagonal red */}
            <Path d="M0 0L24 18M24 0L0 18" stroke="#C8102E" strokeWidth="1.6" />
            {/* Cross white */}
            <Path d="M12 0v18M0 9h24" stroke="#FFFFFF" strokeWidth="5.5" />
            {/* Cross red */}
            <Path d="M12 0v18M0 9h24" stroke="#C8102E" strokeWidth="3.2" />
          </G>
        );

      case 'es':
        return (
          <G>
            {/* Red */}
            <Rect y="0" width="24" height="4.5" fill="#AA151B" />
            {/* Yellow */}
            <Rect y="4.5" width="24" height="9" fill="#F1BF00" />
            {/* Red */}
            <Rect y="13.5" width="24" height="4.5" fill="#AA151B" />
            {/* Emblem representation */}
            <Rect x="5" y="7" width="2.5" height="4" rx="0.5" fill="#AA151B" />
            <Circle cx="6.25" cy="6.2" r="0.75" fill="#C8102E" />
          </G>
        );

      case 'fr':
        return (
          <G>
            <Rect x="0" y="0" width="8" height="18" fill="#002395" />
            <Rect x="8" y="0" width="8" height="18" fill="#FFFFFF" />
            <Rect x="16" y="0" width="8" height="18" fill="#ED2939" />
          </G>
        );

      case 'de':
        return (
          <G>
            <Rect y="0" width="24" height="6" fill="#000000" />
            <Rect y="6" width="24" height="6" fill="#DD0000" />
            <Rect y="12" width="24" height="6" fill="#FFCE00" />
          </G>
        );

      case 'zh':
      case 'cn':
        return (
          <G>
            <Rect width="24" height="18" fill="#DE2910" />
            {/* Large star */}
            <Polygon
              points="4.5,2 5.2,3.8 7,4 5.6,5.2 6,7 4.5,5.9 3,7 3.4,5.2 2,4 3.8,3.8"
              fill="#FFDE00"
            />
            {/* Small stars */}
            <Circle cx="8.5" cy="2.5" r="0.65" fill="#FFDE00" />
            <Circle cx="9.8" cy="4.2" r="0.65" fill="#FFDE00" />
            <Circle cx="9.8" cy="6.4" r="0.65" fill="#FFDE00" />
            <Circle cx="8.5" cy="8.2" r="0.65" fill="#FFDE00" />
          </G>
        );

      case 'ja':
      case 'jp':
        return (
          <G>
            <Rect width="24" height="18" fill="#FFFFFF" />
            <Circle cx="12" cy="9" r="4.2" fill="#BC002D" />
          </G>
        );

      case 'ko':
      case 'kr':
        return (
          <G>
            <Rect width="24" height="18" fill="#FFFFFF" />
            {/* Taegeuk Circle */}
            <Circle cx="12" cy="9" r="3.6" fill="#C60C30" />
            <Path d="M12 9a1.8 1.8 0 0 1 0 3.6 3.6 3.6 0 0 1 0-7.2 1.8 1.8 0 0 0 0 3.6z" fill="#003478" />
            {/* Trigrams (Corner bars) */}
            <Rect x="4" y="3.5" width="2" height="0.6" fill="#000000" />
            <Rect x="4" y="4.5" width="2" height="0.6" fill="#000000" />
            <Rect x="18" y="13" width="2" height="0.6" fill="#000000" />
            <Rect x="18" y="14" width="2" height="0.6" fill="#000000" />
          </G>
        );

      case 'br':
      case 'pt':
        return (
          <G>
            <Rect width="24" height="18" fill="#009739" />
            <Polygon points="12,2 22,9 12,16 2,9" fill="#FEDD00" />
            <Circle cx="12" cy="9" r="3.2" fill="#012169" />
            <Path d="M9.2 8.5a3.2 3.2 0 0 1 5.6 1" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
          </G>
        );

      case 'ru':
        return (
          <G>
            <Rect y="0" width="24" height="6" fill="#FFFFFF" />
            <Rect y="6" width="24" height="6" fill="#0039A6" />
            <Rect y="12" width="24" height="6" fill="#D52B1E" />
          </G>
        );

      case 'ar':
      case 'sa':
        return (
          <G>
            <Rect width="24" height="18" fill="#006C35" />
            {/* White sword/script indicator */}
            <Path
              d="M6 12h12M16 11l2 1-2 1"
              stroke="#FFFFFF"
              strokeWidth="0.8"
              strokeLinecap="round"
            />
            <Circle cx="12" cy="7.5" r="1.5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
          </G>
        );

      case 'it':
        return (
          <G>
            <Rect x="0" y="0" width="8" height="18" fill="#009246" />
            <Rect x="8" y="0" width="8" height="18" fill="#FFFFFF" />
            <Rect x="16" y="0" width="8" height="18" fill="#CE2B37" />
          </G>
        );

      case 'id':
        return (
          <G>
            <Rect y="0" width="24" height="9" fill="#E70011" />
            <Rect y="9" width="24" height="9" fill="#FFFFFF" />
          </G>
        );

      case 'tr':
        return (
          <G>
            <Rect width="24" height="18" fill="#E30A17" />
            {/* Crescent */}
            <Circle cx="10" cy="9" r="3.6" fill="#FFFFFF" />
            <Circle cx="11" cy="9" r="2.9" fill="#E30A17" />
            {/* Star */}
            <Polygon
              points="14.5,7.8 14.8,8.8 15.8,8.8 15,9.4 15.3,10.4 14.5,9.8 13.7,10.4 14,9.4 13.2,8.8 14.2,8.8"
              fill="#FFFFFF"
            />
          </G>
        );

      case 'vi':
      case 'vn':
        return (
          <G>
            <Rect width="24" height="18" fill="#DA251D" />
            {/* Large gold star */}
            <Polygon
              points="12,3.5 13.7,8.8 19.2,8.8 14.8,12 16.5,17.3 12,14 7.5,17.3 9.2,12 4.8,8.8 10.3,8.8"
              fill="#FFFF00"
            />
          </G>
        );

      case 'nl':
        return (
          <G>
            <Rect y="0" width="24" height="6" fill="#AE1C28" />
            <Rect y="6" width="24" height="6" fill="#FFFFFF" />
            <Rect y="12" width="24" height="6" fill="#21468B" />
          </G>
        );

      case 'pl':
        return (
          <G>
            <Rect y="0" width="24" height="9" fill="#FFFFFF" />
            <Rect y="9" width="24" height="9" fill="#DC143C" />
          </G>
        );

      case 'all':
      case 'globe':
      default:
        return (
          <G>
            <Rect width="24" height="18" fill="#1E293B" />
            <Circle cx="12" cy="9" r="6.5" stroke="#38BDF8" strokeWidth="1.2" fill="#0F172A" />
            <Path
              d="M5.5 9h13M12 2.5a8.5 8.5 0 0 1 0 13 8.5 8.5 0 0 1 0-13z"
              stroke="#38BDF8"
              strokeWidth="1"
              fill="none"
            />
          </G>
        );
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width,
          height,
          borderRadius,
        },
        style,
      ]}>
      <Svg width={width} height={height} viewBox="0 0 24 18">
        <Defs>
          <ClipPath id={`clip-${normalized}-${size}`}>
            <Rect width="24" height="18" rx={borderRadius * (24 / width)} />
          </ClipPath>
        </Defs>
        <G clipPath={`url(#clip-${normalized}-${size})`}>
          {renderFlagContent()}
        </G>
        {/* Subtle border to frame white edges */}
        <Rect
          width="24"
          height="18"
          rx={borderRadius * (24 / width)}
          fill="none"
          stroke={AppColors.overlayWhite20 || 'rgba(255,255,255,0.2)'}
          strokeWidth="0.8"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CountryFlag;
