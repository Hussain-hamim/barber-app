import React from 'react';
import { 
  TextInput, 
  View, 
  Text, 
  StyleSheet, 
  StyleProp, 
  ViewStyle, 
  TextStyle, 
  TouchableOpacity,
  TextInputProps 
} from 'react-native';
import { Colors, Typography, Radius } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  labelStyle,
  ...props
}) => {
  const hasError = !!error;
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>{label}</Text>
      )}
      
      <View style={[
        styles.inputContainer,
        hasError && styles.inputContainerError,
        props.editable === false && styles.inputContainerDisabled
      ]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {leftIcon}
          </View>
        )}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            inputStyle
          ]}
          placeholderTextColor={Colors.neutral[400]}
          {...props}
        />
        
        {rightIcon && (
          <TouchableOpacity 
            style={styles.rightIconContainer} 
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    fontFamily: Typography.families.medium,
    fontSize: Typography.sizes.sm,
    color: Colors.neutral[700],
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
  },
  inputContainerError: {
    borderColor: Colors.error[500],
  },
  inputContainerDisabled: {
    backgroundColor: Colors.neutral[100],
    borderColor: Colors.neutral[300],
  },
  input: {
    flex: 1,
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.md,
    color: Colors.neutral[800],
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputWithLeftIcon: {
    paddingLeft: 8,
  },
  inputWithRightIcon: {
    paddingRight: 8,
  },
  leftIconContainer: {
    paddingLeft: 12,
  },
  rightIconContainer: {
    paddingRight: 12,
  },
  errorText: {
    fontFamily: Typography.families.regular,
    fontSize: Typography.sizes.xs,
    color: Colors.error[500],
    marginTop: 4,
  },
});

export default Input;