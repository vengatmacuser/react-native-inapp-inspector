import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import TouchableScale from '../TouchableScale';
import {AppColors} from '../../styles/AppColors';
import {AppFonts} from '../../styles/AppFonts';
import {
  TrashIcon,
  AlertTriangleIcon,
  ResetIcon,
  InfoCircleIcon,
  CloseWhite,
} from '../NetworkIcons';
import {triggerNativeHaptic} from '../../native/NativeInspector';
import {useTranslation} from '../../i18n';

export interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: 'trash' | 'alert' | 'reset' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  confirmText,
  cancelText,
  isDestructive = true,
  icon = 'trash',
  onConfirm,
  onCancel,
}) => {
  const {t} = useTranslation();
  if (!visible) return null;

  const resolvedConfirmText = confirmText || t('common.confirm', 'Confirm');
  const resolvedCancelText = cancelText || t('common.cancel', 'Cancel');

  const handleConfirm = () => {
    triggerNativeHaptic(isDestructive ? 'heavy' : 'medium');
    onConfirm();
  };

  const handleCancel = () => {
    triggerNativeHaptic('light');
    onCancel();
  };

  const renderIcon = () => {
    switch (icon) {
      case 'trash':
        return <TrashIcon size={24} color={AppColors.red500} />;
      case 'alert':
        return <AlertTriangleIcon size={24} color={AppColors.amber500} />;
      case 'reset':
        return <ResetIcon size={24} color={AppColors.purple} />;
      case 'info':
      default:
        return <InfoCircleIcon size={24} color={AppColors.purple} />;
    }
  };

  const badgeBg = isDestructive
    ? AppColors.red100
    : icon === 'alert'
    ? AppColors.amber100
    : AppColors.purple50;

  const badgeBorder = isDestructive
    ? `${AppColors.red500}4D`
    : icon === 'alert'
    ? AppColors.amber200
    : AppColors.purple200;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleCancel} />

        <View style={styles.card}>
          {/* Close corner button */}
          <TouchableScale
            onPress={handleCancel}
            hitSlop={8}
            style={styles.cornerCloseBtn}>
            <CloseWhite size={11} color={AppColors.grayTextWeak} />
          </TouchableScale>

          {/* Top glowing icon badge */}
          <View
            style={[
              styles.iconBadge,
              {backgroundColor: badgeBg, borderColor: badgeBorder},
            ]}>
            {renderIcon()}
          </View>

          {/* Title & Message */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={resolvedCancelText}
              onPress={handleCancel}
              style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>{resolvedCancelText}</Text>
            </TouchableScale>

            <TouchableScale
              accessible={true}
              accessibilityRole="button"
              accessibilityLabel={resolvedConfirmText}
              onPress={handleConfirm}
              style={[
                styles.confirmBtn,
                isDestructive
                  ? styles.confirmBtnDestructive
                  : styles.confirmBtnPrimary,
              ]}>
              <Text style={styles.confirmBtnText}>{resolvedConfirmText}</Text>
            </TouchableScale>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: `${AppColors.slate900}A6`,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: AppColors.white,
    borderRadius: 22,
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: `${AppColors.white}CC`,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.slate900,
        shadowOffset: {width: 0, height: 12},
        shadowOpacity: 0.28,
        shadowRadius: 24,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  cornerCloseBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: AppColors.graySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontFamily: AppFonts.interBold,
    fontSize: 17,
    color: AppColors.slate900,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontFamily: AppFonts.interRegular,
    fontSize: 13,
    color: AppColors.grayTextWeak,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: 8,
    marginBottom: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: AppColors.graySurface,
    borderWidth: 1,
    borderColor: AppColors.grayBorderSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: AppFonts.interSemiBold,
    fontSize: 14,
    color: AppColors.grayText,
  },
  confirmBtn: {
    flex: 1.15,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnDestructive: {
    backgroundColor: AppColors.red500,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.red500,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmBtnPrimary: {
    backgroundColor: AppColors.purple,
    ...Platform.select({
      ios: {
        shadowColor: AppColors.purple,
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.35,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  confirmBtnText: {
    fontFamily: AppFonts.interBold,
    fontSize: 14,
    color: AppColors.white,
    letterSpacing: 0.2,
  },
});
