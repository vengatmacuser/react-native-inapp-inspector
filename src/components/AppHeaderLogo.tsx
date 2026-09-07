import React, {useState} from 'react';
import {
  Image,
  ImageSourcePropType,
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
  const cornerRadius = Math.round(size * 0.23);

  // 1. If customIcon is explicitly provided, render it with smooth squircle edges
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
          style={[logoStyles.image, {borderRadius: cornerRadius - 2}]}
          resizeMode="cover"
        />
      </View>
    );
  }

  // 2. Default: Inspector's Signature Cyber Owl Square Brand App Icon
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
      <BrandSquareIcon size={size} />
    </View>
  );
};

const logoStyles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: AppColors.whiteAlpha33,
    backgroundColor: AppColors.whiteAlpha12,
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 4,
  },
  imageContainer: {
    overflow: 'hidden',
    backgroundColor: AppColors.whiteAlpha15,
    borderWidth: 1.5,
    borderColor: AppColors.whiteAlpha33,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: AppColors.shadowColorString,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
    padding: 1.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
});

export default AppHeaderLogo;

