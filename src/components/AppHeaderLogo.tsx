import React, {useState} from 'react';
import {
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import BrandSquareIcon from './BrandSquareIcon';
import {AppColors} from '../styles/AppColors';

interface AppHeaderLogoProps {
  size?: number;
  customIcon?: ImageSourcePropType | null;
}

export const AppHeaderLogo: React.FC<AppHeaderLogoProps> = ({
  size = 46,
  customIcon,
}) => {
  const [loadError, setLoadError] = useState(false);

  // 1. If customIcon is explicitly provided, render it directly edge-to-edge
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
            logoStyles.svgContainer,
            {
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.23),
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
            borderRadius: Math.round(size * 0.23),
          },
        ]}>
        <Image
          source={customIcon as ImageSourcePropType}
          style={logoStyles.image}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2. Dynamically query installed native app icon (AppIcon on iOS, ic_launcher on Android)
  if (!loadError && Platform.OS !== 'web') {
    const nativeSource: ImageSourcePropType = Platform.select({
      ios: {uri: 'AppIcon'},
      android: {uri: 'ic_launcher'},
      default: {uri: 'AppIcon'},
    });

    return (
      <View
        style={[
          logoStyles.imageContainer,
          {
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.23),
          },
        ]}>
        <Image
          source={nativeSource}
          style={logoStyles.image}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  // 3. Fallback: Inspector's Signature Owl Brand Logo
  return (
    <View
      style={[
        logoStyles.svgContainer,
        {
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.23),
        },
      ]}>
      <BrandSquareIcon size={size} />
    </View>
  );
};

const logoStyles = StyleSheet.create({
  svgContainer: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 3,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});

export default AppHeaderLogo;
