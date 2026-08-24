import React from 'react';
import Svg, {
  Circle,
  Path,
  G,
  Defs,
  LinearGradient,
  RadialGradient,
  Stop,
  Rect,
  Ellipse,
  Line,
} from 'react-native-svg';

export const BrandSquareIcon = ({size = 56}: {size?: number}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      <Defs>
        <LinearGradient id="bs_tile" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#1E1B4B" />
          <Stop offset="1" stopColor="#0F172A" />
        </LinearGradient>
        <LinearGradient id="bs_beam" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#818CF8" />
          <Stop offset="0.5" stopColor="#A855F7" />
          <Stop offset="1" stopColor="#EC4899" />
        </LinearGradient>
        <LinearGradient id="bs_body" x1="0" y1="0" x2="0" y2="256" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#312E81" />
          <Stop offset="1" stopColor="#1E1B4B" />
        </LinearGradient>
        <RadialGradient id="bs_iris" cx="40%" cy="40%" r="60%">
          <Stop offset="0" stopColor="#FDE047" />
          <Stop offset="0.7" stopColor="#F59E0B" />
          <Stop offset="1" stopColor="#D97706" />
        </RadialGradient>
        <LinearGradient id="bs_beak" x1="0" y1="0" x2="0" y2="20" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FBBF24" />
          <Stop offset="1" stopColor="#F97316" />
        </LinearGradient>
      </Defs>

      {/* Rounded App Tile Background */}
      <Rect x="8" y="8" width="240" height="240" rx="54" fill="url(#bs_tile)" />
      <Rect
        x="8"
        y="8"
        width="240"
        height="240"
        rx="54"
        fill="none"
        stroke="url(#bs_beam)"
        strokeWidth="3"
        strokeOpacity={0.4}
      />

      {/* Owl Outer Body Contour */}
      <Path
        d="M64 148 C60 102 72 68 92 56 L100 40 L118 60 Q128 55 138 60 L156 40 L164 56 C184 68 196 102 192 148 C196 178 182 202 150 210 C138 214 118 214 106 210 C74 202 60 178 64 148 Z"
        fill="url(#bs_body)"
        stroke="url(#bs_beam)"
        strokeWidth="4"
        strokeLinejoin="round"
      />

      {/* Wings */}
      <Path
        d="M74 124 C58 154 60 190 86 204 C79 176 77 148 88 126 Z"
        fill="#1E1B4B"
        stroke="#818CF8"
        strokeWidth="2.5"
        strokeOpacity={0.6}
      />
      <Path
        d="M182 124 C198 154 196 190 170 204 C177 176 179 148 168 126 Z"
        fill="#1E1B4B"
        stroke="#818CF8"
        strokeWidth="2.5"
        strokeOpacity={0.6}
      />

      {/* Belly Screen Plate */}
      <Rect
        x="105"
        y="160"
        width="46"
        height="34"
        rx="8"
        fill="#0B0F19"
        stroke="url(#bs_beam)"
        strokeWidth="2"
      />
      {/* Code Emblem on Chest */}
      <G stroke="#A5B4FC" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M120 171 L114 177 L120 183" />
        <Path d="M136 171 L142 177 L136 183" />
        <Path d="M130 169 L126 185" stroke="#EC4899" />
      </G>

      {/* Facial Disc & Mask */}
      <Path
        d="M128 92 C148 70 186 78 186 108 C186 134 160 152 128 152 C96 152 70 134 70 108 C70 78 108 70 128 92 Z"
        fill="#2E1065"
        stroke="#818CF8"
        strokeWidth="2"
        strokeOpacity={0.6}
      />

      {/* Right Eye (Normal Cute Eye) */}
      <Circle cx="154" cy="108" r="17" fill="url(#bs_iris)" stroke="#0F172A" strokeWidth="2" />
      <Circle cx="154" cy="108" r="8.5" fill="#0F172A" />
      <Circle cx="157" cy="105" r="3" fill="#FFFFFF" />
      <Circle cx="151" cy="111" r="1.5" fill="#FFFFFF" opacity={0.8} />

      {/* Left Eye (Diagnostic Magnifier Lens) */}
      <Circle cx="96" cy="104" r="20" fill="url(#bs_iris)" stroke="#0F172A" strokeWidth="2" />
      <Circle cx="96" cy="104" r="10" fill="#0F172A" />
      <Circle cx="99.5" cy="100.5" r="3.5" fill="#FFFFFF" />
      <Circle cx="92" cy="107" r="1.8" fill="#FFFFFF" opacity={0.8} />

      {/* Magnifier Glass Ring & Handle */}
      <Line x1="76" y1="124" x2="55" y2="148" stroke="#0F172A" strokeWidth="12" strokeLinecap="round" />
      <Line x1="76" y1="124" x2="55" y2="148" stroke="url(#bs_beam)" strokeWidth="7" strokeLinecap="round" />
      <Circle cx="96" cy="104" r="28" fill="#38BDF8" fillOpacity={0.12} stroke="url(#bs_beam)" strokeWidth="6" />

      {/* Beak */}
      <Path
        d="M123.5 123 Q128 121 132.5 123 Q131 132 128 134.5 Q125 132 123.5 123 Z"
        fill="url(#bs_beak)"
      />
    </Svg>
  );
};

export default BrandSquareIcon;
