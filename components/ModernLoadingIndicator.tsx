import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
  Easing,
  interpolate,
  withSequence,
  withDelay,
  Extrapolate,
} from 'react-native-reanimated';
import { Scissors } from 'lucide-react-native';

const BarberLoadingIndicator = ({
  message = 'Securing your appointment',
  color = '#3b82f6',
  textColor = '#334155',
  size = 'medium',
}) => {
  // Animation values
  const rotation = useSharedValue(0);
  const pulse = useSharedValue(0);
  const wave = useSharedValue(0);

  // Size presets
  const sizes = {
    small: { icon: 24, text: 14, spacing: 12 },
    medium: { icon: 32, text: 16, spacing: 16 },
    large: { icon: 40, text: 18, spacing: 20 },
  };

  const { icon, text, spacing } = sizes[size];

  React.useEffect(() => {
    // Rotation animation (continuous)
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1800,
        easing: Easing.linear,
      }),
      -1
    );

    // Pulse animation (icon breathing effect)
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 600,
          easing: Easing.out(Easing.quad),
        }),
        withTiming(0, {
          duration: 600,
          easing: Easing.in(Easing.quad),
        })
      ),
      -1
    );

    // Wave animation (text and dots)
    wave.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 800,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0, {
          duration: 800,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1
    );
  }, []);

  // Animated styles
  const animatedScissors = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotation.value}deg` },
      {
        scale: interpolate(pulse.value, [0, 1], [0.95, 1.05]),
      },
    ],
  }));

  const animatedText = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.9, 1]),
    transform: [
      {
        translateY: interpolate(wave.value, [0, 1], [0, -4]),
      },
    ],
  }));

  const dotStyle = (index: number) =>
    useAnimatedStyle(() => {
      const delay = index * 150;
      const animatedValue =
        delay > 0 ? withDelay(delay, wave.value) : wave.value;

      return {
        opacity: interpolate(
          animatedValue,
          [0, 0.5, 1],
          [0.3, 1, 0.3],
          Extrapolate.CLAMP
        ),
        transform: [
          {
            translateY: interpolate(
              animatedValue,
              [0, 1],
              [0, index % 2 ? -5 : 5]
            ),
          },
        ],
      };
    });

  return (
    <View style={[styles.container, { gap: spacing }]}>
      <Animated.View style={animatedScissors}>
        <Scissors size={icon} color={color} strokeWidth={2} />
      </Animated.View>

      <Animated.View style={[styles.textRow, animatedText]}>
        <Animated.Text
          style={[
            styles.text,
            {
              fontSize: text,
              color: textColor,
            },
          ]}
        >
          {message}
        </Animated.Text>

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <Animated.View
              key={i}
              style={[styles.dot, { backgroundColor: textColor }, dotStyle(i)]}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  textRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontWeight: '500',
    letterSpacing: 0.25,
    marginRight: 6,
  },
  dots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});

export default BarberLoadingIndicator;
