import React, {useEffect, useRef} from 'react';
import {Animated, Easing, StyleSheet, View} from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from 'react-native-svg';

export interface AnimatedBrandOwlProps {
  size?: number;
  shape?: 'square' | 'circle';
}

export const AnimatedBrandOwl: React.FC<AnimatedBrandOwlProps> = ({
  size = 64,
  shape = 'square',
}) => {
  // Single unified harmonic float loop for 100% buttery-smooth 60/120 FPS native motion
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bob = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    bob.start();
    return () => bob.stop();
  }, [floatAnim]);

  // Smooth vertical floating range: bobs up smoothly by 8px
  const floatY = floatAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  // Mathematically coupled subtle lean (0deg -> -1.8deg -> 0deg) perfectly synchronized with the float
  const leanRot = floatAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['0deg', '-1.8deg', '0deg'],
  });

  const isSquare = shape === 'square';
  const containerRadius = isSquare ? Math.round(size * 0.2265) : size / 2;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: containerRadius,
        },
      ]}>
      <Animated.View
        style={[
          styles.animatedLayer,
          {
            transform: [{translateY: floatY}, {rotate: leanRot}],
          },
        ]}>
        <Svg width={size} height={size} viewBox="0 0 256 256" fill="none">
          <Defs>
            {/* Cyan/Violet Radiant Beam */}
            <LinearGradient
              id="owl_beam"
              x1="70"
              y1="74"
              x2="194"
              y2="187"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#5EEAD4" />
              <Stop offset="0.5" stopColor="#38BDF8" />
              <Stop offset="1" stopColor="#A78BFA" />
            </LinearGradient>

            {/* Glowing Cyan Halo */}
            <RadialGradient id="owl_halo" cx="0.5" cy="0.45" r="0.55">
              <Stop offset="0" stopColor="#38BDF8" stopOpacity={0.25} />
              <Stop offset="1" stopColor="#38BDF8" stopOpacity={0} />
            </RadialGradient>

            {/* Main Body Gradient */}
            <LinearGradient
              id="owl_body"
              x1="78"
              y1="60"
              x2="178"
              y2="186"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#24345F" />
              <Stop offset="1" stopColor="#121B35" />
            </LinearGradient>

            {/* Beak / Claws Gradient */}
            <LinearGradient
              id="owl_beak"
              x1="120"
              y1="151"
              x2="136"
              y2="168"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#FCD34D" />
              <Stop offset="1" stopColor="#FB923C" />
            </LinearGradient>

            {/* Iris Gradient */}
            <RadialGradient id="owl_iris" cx="0.42" cy="0.38" r="0.72">
              <Stop offset="0" stopColor="#FDE68A" />
              <Stop offset="0.5" stopColor="#FBBF24" />
              <Stop offset="1" stopColor="#F59E0B" />
            </RadialGradient>

            {/* Blush Gradient */}
            <RadialGradient id="owl_blush" cx="0.5" cy="0.5" r="0.5">
              <Stop offset="0" stopColor="#FB7185" stopOpacity={0.6} />
              <Stop offset="1" stopColor="#FB7185" stopOpacity={0} />
            </RadialGradient>

            {/* Wing Gradient */}
            <LinearGradient
              id="owl_wing"
              x1="70"
              y1="120"
              x2="190"
              y2="206"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#1D2A4F" />
              <Stop offset="1" stopColor="#0F1735" />
            </LinearGradient>

            {/* Faceplate Gradient */}
            <LinearGradient
              id="owl_faceplate"
              x1="70"
              y1="72"
              x2="186"
              y2="152"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#3B528D" />
              <Stop offset="1" stopColor="#223358" />
            </LinearGradient>

            {/* Magnifier Lens Glass */}
            <RadialGradient id="owl_lensglass" cx="0.4" cy="0.32" r="0.75">
              <Stop offset="0" stopColor="#7DE8FF" stopOpacity={0.25} />
              <Stop offset="0.7" stopColor="#7DE8FF" stopOpacity={0.06} />
              <Stop offset="1" stopColor="#7DE8FF" stopOpacity={0} />
            </RadialGradient>

            {/* Belly Plate Gradient */}
            <LinearGradient
              id="owl_belly"
              x1="94"
              y1="126"
              x2="162"
              y2="212"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#384F88" />
              <Stop offset="1" stopColor="#20305C" />
            </LinearGradient>

            {/* Dark Midnight/Black Tile Background Gradient */}
            <LinearGradient
              id="owl_tile"
              x1="30"
              y1="30"
              x2="210"
              y2="222"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#141B33" />
              <Stop offset="1" stopColor="#0A0E1C" />
            </LinearGradient>

            {/* Subtle Metallic Edge Ring Gradient */}
            <LinearGradient
              id="owl_edge"
              x1="14"
              y1="22"
              x2="220"
              y2="228"
              gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor="#3A4E7A" />
              <Stop offset="1" stopColor="#1A2238" />
            </LinearGradient>
          </Defs>

          {/* ─── Background Tile & Outer Border Ring ─── */}
          {isSquare ? (
            <>
              <Rect x={8} y={8} width={240} height={240} rx={58} fill="url(#owl_tile)" />
              <Rect
                x={8.6}
                y={8.6}
                width={238.8}
                height={238.8}
                rx={57.4}
                fill="none"
                stroke="url(#owl_edge)"
                strokeOpacity={0.75}
                strokeWidth={1.6}
              />
              <Circle cx={128} cy={128} r={104} fill="url(#owl_halo)" />
            </>
          ) : (
            <>
              <Circle cx={128} cy={128} r={122} fill="url(#owl_tile)" />
              <Circle
                cx={128}
                cy={128}
                r={121.4}
                fill="none"
                stroke="url(#owl_edge)"
                strokeOpacity={0.75}
                strokeWidth={1.6}
              />
              <Circle cx={128} cy={128} r={105} fill="url(#owl_halo)" />
            </>
          )}

          {/* ─── Owl Character Body & Accessories ─── */}
          <G
            transform={
              isSquare
                ? 'translate(128 128) scale(1.16) translate(-128 -134)'
                : 'translate(128 132) scale(1.08) translate(-128 -134)'
            }>
            {/* Wings */}
            <Path
              d="M74 124 C58 154 60 190 86 204 C79 176 77 148 88 126 Z"
              fill="url(#owl_wing)"
              stroke="url(#owl_beam)"
              strokeWidth={2.5}
              strokeOpacity={0.5}
            />
            <Path
              d="M182 124 C198 154 196 190 170 204 C177 176 179 148 168 126 Z"
              fill="url(#owl_wing)"
              stroke="url(#owl_beam)"
              strokeWidth={2.5}
              strokeOpacity={0.5}
            />

            {/* Main Owl Body */}
            <Path
              d="M62 150 C58 104 70 70 90 58 L98 42 L116 62 Q128 57 140 62 L158 42 L166 58 C186 70 198 104 194 150 C198 180 184 204 152 212 C140 216 116 216 104 212 C72 204 58 180 62 150 Z"
              fill="url(#owl_body)"
              stroke="url(#owl_beam)"
              strokeWidth={4}
              strokeLinejoin="round"
            />

            {/* Inner Ear Shadows */}
            <Path d="M99 48 L114 62 L104 63 L98 55 Z" fill="#080F22" opacity={0.55} />
            <Path d="M157 48 L142 62 L152 63 L158 55 Z" fill="#080F22" opacity={0.55} />

            {/* Wing Feather Accents */}
            <G stroke="#22325A" strokeWidth={2.2} fill="none" strokeLinecap="round" opacity={0.75}>
              <Path d="M80 138 q-5 26 3 50" />
              <Path d="M90 134 q-4 26 3 48" />
              <Path d="M176 138 q5 26 -3 50" />
              <Path d="M166 134 q4 26 -3 48" />
            </G>

            {/* Belly Plate */}
            <Path
              d="M128 126 C151 126 164 148 162 174 C160 198 146 212 128 212 C110 212 96 198 94 174 C92 148 105 126 128 126 Z"
              fill="url(#owl_belly)"
            />

            {/* Belly Feather Scallops */}
            <G stroke="#4A659E" strokeWidth={2.3} fill="none" strokeLinecap="round" opacity={0.45}>
              <Path d="M110 154 Q118 162 126 154" />
              <Path d="M126 154 Q134 162 142 154" />
              <Path d="M142 154 Q150 162 158 154" />
              <Path d="M102 172 Q110 180 118 172" />
              <Path d="M150 172 Q158 180 166 172" />
              <Path d="M112 190 Q120 198 128 190" />
              <Path d="M128 190 Q136 198 144 190" />
            </G>

            {/* Developer Chest Screen with Code Emblem */}
            <Rect
              x={107}
              y={161}
              width={42}
              height={32}
              rx={9}
              fill="#0A1020"
              stroke="url(#owl_beam)"
              strokeWidth={2}
              strokeOpacity={0.8}
            />
            <G stroke="#7DD3FC" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none">
              <Path d="M122 170 L115 177 L122 184" />
              <Path d="M134 170 L141 177 L134 184" />
              <Path d="M130 168 L126 186" />
            </G>

            {/* Facial Disc */}
            <Path
              d="M128 92 C148 70 186 78 186 108 C186 134 160 152 128 152 C96 152 70 134 70 108 C70 78 108 70 128 92 Z"
              fill="url(#owl_faceplate)"
              stroke="#52709E"
              strokeWidth={2.6}
              strokeOpacity={0.7}
            />
            <Path d="M128 96 L128 120" stroke="#52709E" strokeWidth={2} strokeLinecap="round" strokeOpacity={0.45} />

            {/* Feet */}
            <G stroke="url(#owl_beak)" strokeWidth={5} strokeLinecap="round" fill="none">
              <Path d="M111 209 L105 224 M111 209 L111 226 M111 209 L117 224" />
              <Path d="M145 209 L139 224 M145 209 L145 226 M145 209 L151 224" />
            </G>

            {/* Normal Eye */}
            <Circle cx={153} cy={107} r={17} fill="url(#owl_iris)" stroke="#1A1205" strokeWidth={2.2} />
            <Circle cx={153} cy={108} r={8.2} fill="#0A0E18" />
            <Circle cx={156.2} cy={104} r={3.1} fill="#FFFFFF" opacity={0.95} />
            <Circle cx={149.6} cy={111} r={1.6} fill="#FFFFFF" opacity={0.7} />

            {/* Beak */}
            <Path
              d="M123.5 123 Q128 121 132.5 123 Q131 132 128 134.5 Q125 132 123.5 123 Z"
              fill="url(#owl_beak)"
            />

            {/* Debug Magnifier held to left eye */}
            <Circle cx={95} cy={103} r={20} fill="url(#owl_iris)" stroke="#1A1205" strokeWidth={2.6} />
            <Circle cx={95} cy={104} r={10} fill="#0A0E18" />
            <Circle cx={98.6} cy={100} r={3.4} fill="#FFFFFF" opacity={0.95} />
            <Circle cx={91} cy={107} r={1.8} fill="#FFFFFF" opacity={0.7} />
            <Circle cx={95} cy={103} r={28} fill="url(#owl_lensglass)" />
            <Path
              d="M77 87 A28 28 0 0 1 106 79"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={4}
              strokeLinecap="round"
              strokeOpacity={0.5}
            />

            {/* Magnifier Handle */}
            <Line x1={75} y1={123} x2={54} y2={147} stroke="#0A0F1C" strokeWidth={14} strokeLinecap="round" />
            <Line x1={75} y1={123} x2={54} y2={147} stroke="url(#owl_beam)" strokeWidth={8.5} strokeLinecap="round" />

            {/* Glowing Cyan Lens Ring */}
            <Circle cx={95} cy={103} r={28} fill="none" stroke="url(#owl_beam)" strokeWidth={7} />

            {/* Rosy Cheeks */}
            <Ellipse cx={83} cy={127} rx={9} ry={6} fill="url(#owl_blush)" />
            <Ellipse cx={167} cy={122} rx={9} ry={6} fill="url(#owl_blush)" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  animatedLayer: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedBrandOwl;
