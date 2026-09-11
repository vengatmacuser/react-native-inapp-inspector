import React from 'react';
import {
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import BrandCircleIcon from './BrandCircleIcon';

interface AppHeaderLogoProps {
  size?: number;
  customIcon?: ImageSourcePropType | null;
}

export const AppHeaderLogo: React.FC<AppHeaderLogoProps> = ({
  size = 52,
  customIcon,
}) => {
  const cornerRadius = Math.round(size * 0.23);

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

  // 2. Default: Inspector's Signature FAB Icon Logo (Cyber Owl Circular Emblem)
  return <BrandCircleIcon size={size} />;
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


