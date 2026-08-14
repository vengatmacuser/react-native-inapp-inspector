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

  // 1. If customIcon is explicitly provided, render it directly
  if (customIcon) {
    return (
      <View style={[logoStyles.container, {width: size, height: size}]}>
        <Image
          source={customIcon}
          style={{width: size - 4, height: size - 4, borderRadius: 10}}
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
          style={{width: size - 4, height: size - 4, borderRadius: 10}}
          resizeMode="cover"
          onError={() => setLoadError(true)}
        />
      </View>
    );
  }

  // 3. Fallback: Inspector's Signature Owl Brand Logo
  return (
    <View style={[logoStyles.container, {width: size, height: size}]}>
      <BrandSquareIcon size={size - 4} />
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: `${AppColors.white}24`,
    borderWidth: 1.5,
    borderColor: `${AppColors.white}4D`,
    overflow: 'hidden',
    shadowColor: AppColors.primaryBlack,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
});

export default AppHeaderLogo;
