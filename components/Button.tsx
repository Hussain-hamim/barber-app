import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  StyleProp, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { Colors, Typography, Radius } from '@/constants/theme';

type ButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  // Style maps for variants and sizes
  const variantStyles = {
    primary: {
      container: {
        backgroundColor: Colors.primary[600],
      },
      text: {
        color: Colors.white,
      },
    },
    secondary: {
      container: {
        backgroundColor: Colors.secondary[600],
      },
      text: {
        color: Colors.white,
      },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.primary[600],
      },
      text: {
        color: Colors.primary[600],
      },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
      },
      text: {
        color: Colors.primary[600],
      },
    },
  };

  const sizeStyles = {
    sm: {
      container: {
        paddingVertical: 8,
        paddingHorizontal: 16,
      },
      text: {
        fontSize: Typography.sizes.sm,
      },
    },
    md: {
      container: {
        paddingVertical: 12,
        paddingHorizontal: 20,
      },
      text: {
        fontSize: Typography.sizes.md,
      },
    },
    lg: {
      container: {
        paddingVertical: 16,
        paddingHorizontal: 24,
      },
      text: {
        fontSize: Typography.sizes.lg,
      },
    },
  };

  const containerStyle = [
    styles.container,
    variantStyles[variant].container,
    sizeStyles[size].container,
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    variantStyles[variant].text,
    sizeStyles[size].text,
    (disabled || loading) && styles.disabledText,
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary[600] : Colors.white} 
        />
      ) : (
        <>
          {leftIcon && leftIcon}
          <Text style={textStyles}>{title}</Text>
          {rightIcon && rightIcon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    gap: 8,
  },
  text: {
    fontFamily: Typography.families.medium,
    textAlign: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.6,
  },
  disabledText: {
    opacity: 0.8,
  },
});

export default Button;