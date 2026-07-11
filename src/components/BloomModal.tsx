import { useEffect, useRef } from 'react';
import { Animated, Modal, StyleSheet, Text, View } from 'react-native';
import { painColor } from '../constants';
import { useI18n } from '../i18n';

interface Props {
  visible: boolean;
  painLevel: number;
  onHide: () => void;
}

export default function BloomModal({ visible, painLevel, onHide }: Props) {
  const { t }   = useI18n();
  const scale   = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotate  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    scale.setValue(0);
    opacity.setValue(1);
    rotate.setValue(0);

    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, damping: 6, mass: 0.6 }),
      Animated.timing(rotate, { toValue: 1, duration: 600, useNativeDriver: true }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(opacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(onHide);
      }, 1200);
    });
  }, [visible]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '15deg'] });
  const color = painColor(painLevel);

  return (
    <Modal transparent visible={visible} animationType="none">
      <Animated.View style={[styles.overlay, { opacity }]}>
        <Animated.View style={[
          styles.circle,
          { backgroundColor: color + '22', borderColor: color + '44' },
          { transform: [{ scale }] },
        ]}>
          {/* Petals */}
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <Animated.View
              key={deg}
              style={[
                styles.petal,
                { backgroundColor: color },
                { transform: [{ rotate: `${deg}deg` }, { translateY: -28 }, { rotate: spin }] },
              ]}
            />
          ))}
          <View style={[styles.center, { backgroundColor: color }]}>
            <Text style={styles.centerEmoji}>🌸</Text>
          </View>
        </Animated.View>
        <Animated.Text style={[styles.label, { transform: [{ scale }] }]}>
          {t('saved_message')}
        </Animated.Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(30,31,51,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  petal: {
    position: 'absolute',
    width: 20,
    height: 36,
    borderRadius: 10,
    opacity: 0.85,
  },
  center: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
  },
  centerEmoji: { fontSize: 26 },
  label: {
    marginTop: 28,
    fontSize: 22,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
