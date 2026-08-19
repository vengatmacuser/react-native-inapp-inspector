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
    return (
      <View style={[logoStyles.container, {width: size, height: size}]}>
        <Image
          source={customIcon}
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
      <View style={[logoStyles.container, {width: size, height: size}]}>
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
    <View style={[logoStyles.container, {width: size, height: size}]}>
      <BrandSquareIcon size={size} />
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
});

export default AppHeaderLogo;
