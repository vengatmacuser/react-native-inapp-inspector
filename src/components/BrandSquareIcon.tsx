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
  Line,
} from 'react-native-svg';

export const BrandSquareIcon = ({size = 56}: {size?: number}) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
      <Defs>
        {/* App Tile Background - Crisp Royal Deep Violet to Midnight */}
        <LinearGradient id="bs_tile" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#1E1B4B" />
          <Stop offset="50%" stopColor="#18182F" />
          <Stop offset="100%" stopColor="#0B0F19" />
        </LinearGradient>

        {/* Outer Neon Cyber Border */}
        <LinearGradient id="bs_border" x1="0" y1="0" x2="256" y2="256" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#818CF8" stopOpacity={0.9} />
          <Stop offset="45%" stopColor="#C084FC" stopOpacity={0.8} />
          <Stop offset="80%" stopColor="#F472B6" stopOpacity={0.85} />
          <Stop offset="100%" stopColor="#38BDF8" stopOpacity={0.9} />
        </LinearGradient>

        {/* Ambient Top Glow */}
        <RadialGradient id="bs_top_glow" cx="50%" cy="15%" r="65%">
          <Stop offset="0%" stopColor="#818CF8" stopOpacity={0.35} />
          <Stop offset="60%" stopColor="#A855F7" stopOpacity={0.12} />
          <Stop offset="100%" stopColor="#1E1B4B" stopOpacity={0} />
        </RadialGradient>

        {/* Owl Outer Body Gradient - High Contrast */}
        <LinearGradient id="bs_body" x1="64" y1="40" x2="192" y2="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#3730A3" />
          <Stop offset="50%" stopColor="#2E1065" />
          <Stop offset="100%" stopColor="#17123A" />
        </LinearGradient>

        {/* Neon Cyber Beam Stroke */}
        <LinearGradient id="bs_beam" x1="40" y1="40" x2="220" y2="220" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#67E8F9" />
          <Stop offset="35%" stopColor="#818CF8" />
          <Stop offset="70%" stopColor="#C084FC" />
          <Stop offset="100%" stopColor="#F472B6" />
        </LinearGradient>

        {/* Eyes Radiant Iris */}
        <RadialGradient id="bs_iris" cx="38%" cy="36%" r="65%">
          <Stop offset="0%" stopColor="#FEF08A" />
          <Stop offset="40%" stopColor="#FBBF24" />
          <Stop offset="80%" stopColor="#F59E0B" />
          <Stop offset="100%" stopColor="#D97706" />
        </RadialGradient>

        {/* Beak Gradient */}
        <LinearGradient id="bs_beak" x1="124" y1="120" x2="132" y2="136" gradientUnits="userSpaceOnUse">
          <Stop offset="0%" stopColor="#FDE047" />
          <Stop offset="100%" stopColor="#EA580C" />
        </LinearGradient>

        {/* Diagnostic Lens Glass Flare */}
        <RadialGradient id="bs_lens" cx="40%" cy="35%" r="65%">
          <Stop offset="0%" stopColor="#A5F3FC" stopOpacity={0.4} />
          <Stop offset="50%" stopColor="#38BDF8" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#0284C7" stopOpacity={0.05} />
        </RadialGradient>
      </Defs>

      {/* ── 1. Rounded App Tile Base (Full Edge-to-Edge) ── */}
      <Rect x="2" y="2" width="252" height="252" rx="58" fill="url(#bs_tile)" />
      <Rect x="2" y="2" width="252" height="252" rx="58" fill="url(#bs_top_glow)" />
      <Rect
        x="2"
        y="2"
        width="252"
        height="252"
        rx="58"
        fill="none"
        stroke="url(#bs_border)"
        strokeWidth="3.5"
      />

      {/* ── 2. Owl Outer Wings (Layered behind) ── */}
      <Path
        d="M62 120 C42 152 46 194 76 210 C68 178 66 146 80 120 Z"
        fill="#1E1B4B"
        stroke="url(#bs_beam)"
        strokeWidth="3"
        strokeOpacity={0.75}
      />
      <Path
        d="M194 120 C214 152 210 194 180 210 C188 178 190 146 176 120 Z"
        fill="#1E1B4B"
        stroke="url(#bs_beam)"
        strokeWidth="3"
        strokeOpacity={0.75}
      />

      {/* ── 3. Owl Body Contour ── */}
      <Path
        d="M58 146 C54 98 68 64 88 52 L98 34 L118 56 Q128 50 138 56 L158 34 L168 52 C188 64 202 98 198 146 C202 180 186 208 152 216 C140 220 116 220 104 216 C70 208 54 180 58 146 Z"
        fill="url(#bs_body)"
        stroke="url(#bs_beam)"
        strokeWidth="4.5"
        strokeLinejoin="round"
      />

      {/* Inner Ear Highlights */}
      <Path d="M98 42 L112 56 L102 57 Z" fill="#67E8F9" opacity={0.6} />
      <Path d="M158 42 L144 56 L154 57 Z" fill="#F472B6" opacity={0.6} />

      {/* ── 4. Chest Terminal & Code Braces ── */}
      <Rect
        x="98"
        y="162"
        width="60"
        height="38"
        rx="10"
        fill="#050811"
        stroke="url(#bs_beam)"
        strokeWidth="2.5"
      />
      <G strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <Path d="M116 174 L108 181 L116 188" stroke="#38BDF8" />
        <Path d="M140 174 L148 181 L140 188" stroke="#38BDF8" />
        <Path d="M131 171 L125 191" stroke="#F43F5E" />
      </G>

      {/* ── 5. Facial Mask Plate ── */}
      <Path
        d="M128 88 C152 64 192 72 192 104 C192 132 162 152 128 152 C94 152 64 132 64 104 C64 72 104 64 128 88 Z"
        fill="#1E1B4B"
        stroke="url(#bs_beam)"
        strokeWidth="2.8"
      />

      {/* ── 6. Right Eye (Glowing Owl Eye) ── */}
      <Circle cx="156" cy="106" r="19" fill="url(#bs_iris)" stroke="#0F172A" strokeWidth="2.5" />
      <Circle cx="156" cy="106" r="9.5" fill="#0B0F19" />
      <Circle cx="159.5" cy="102.5" r="3.5" fill="#FFFFFF" />
      <Circle cx="153" cy="109.5" r="1.8" fill="#FFFFFF" opacity={0.85} />

      {/* ── 7. Left Eye (Diagnostic Magnifier Lens) ── */}
      {/* Magnifier Glass Glow */}
      <Circle cx="94" cy="104" r="30" fill="url(#bs_lens)" stroke="url(#bs_beam)" strokeWidth="6" />
      <Line x1="72" y1="126" x2="48" y2="152" stroke="#0B0F19" strokeWidth="13" strokeLinecap="round" />
      <Line x1="72" y1="126" x2="48" y2="152" stroke="url(#bs_beam)" strokeWidth="8" strokeLinecap="round" />

      {/* Eye Inside Magnifier */}
      <Circle cx="94" cy="104" r="21" fill="url(#bs_iris)" stroke="#0F172A" strokeWidth="2.5" />
      <Circle cx="94" cy="104" r="10.5" fill="#0B0F19" />
      <Circle cx="98" cy="100" r="4" fill="#FFFFFF" />
      <Circle cx="90.5" cy="107.5" r="2" fill="#FFFFFF" opacity={0.85} />

      {/* Lens Reflection Highlight */}
      <Path
        d="M74 94 A26 26 0 0 1 106 78"
        stroke="#FFFFFF"
        strokeWidth="3"
        strokeLinecap="round"
        opacity={0.65}
        fill="none"
      />

      {/* ── 8. Beak ── */}
      <Path
        d="M123 120 Q128 118 133 120 Q131.5 133 128 137 Q124.5 133 123 120 Z"
        fill="url(#bs_beak)"
        stroke="#78350F"
        strokeWidth="1"
      />
    </Svg>
  );
};

export default BrandSquareIcon;
