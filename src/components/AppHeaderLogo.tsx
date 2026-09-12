import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';

// Bundled animated GIF logo for the Inspector brand
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BRAND_GIF_LOGO = require('../../../assets/inapp_inspector_icon.gif');

interface AppHeaderLogoProps {
  size?: number;
  customIcon?: ImageSourcePropType | null;
  shape?: 'square' | 'circle';
}

export const AppHeaderLogo: React.FC<AppHeaderLogoProps> = ({
  size = 64,
  customIcon,
  shape = 'square',
}) => {
  const cornerRadius = shape === 'circle' ? size / 2 : Math.round(size * 0.2265);

  // 1. If customIcon is explicitly provided, render it
  if (customIcon) {
    if (React.isValidElement(customIcon)) {
      const clonedIcon = React.cloneElement(
        customIcon as React.ReactElement<any>,
        {
          size,
          width: size,
          height: size,
        },
      );
      return (
        <View
          style={[
            logoStyles.container,
            {
              width: size,
              height: size,
              borderRadius: cornerRadius,
            },
          ]}>
          {clonedIcon}
        </View>
      );
    }
    return (
      <View
        style={[
          logoStyles.imageContainer,
          {
            width: size,
            height: size,
            borderRadius: cornerRadius,
          },
        ]}>
        <Image
          source={customIcon as ImageSourcePropType}
          style={[logoStyles.image, {borderRadius: cornerRadius}]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2. Default: Inspector's Animated GIF Brand Logo
  return (
    <View
      style={[
        logoStyles.imageContainer,
        {
          width: size,
          height: size,
          borderRadius: cornerRadius,
        },
      ]}>
      <Image
        source={BRAND_GIF_LOGO}
        style={[logoStyles.image, {borderRadius: cornerRadius}]}
        resizeMode="cover"
      />
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default AppHeaderLogo;


