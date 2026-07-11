import { Component, ReactNode } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BG, DARK, MUTED, PINK, WHITE } from '../constants';

interface Props { children: ReactNode }
interface State { error: Error | null }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <View style={s.safe}>
        <Text style={s.emoji}>🌸</Text>
        <Text style={s.title}>Nimadir xato ketdi</Text>
        <Text style={s.sub}>Что-то пошло не так · Something went wrong</Text>
        <Text style={s.detail} numberOfLines={3}>{this.state.error.message}</Text>
        <TouchableOpacity style={s.btn} onPress={() => this.setState({ error: null })}>
          <Text style={s.btnTxt}>Qayta urinish · Повторить · Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: BG, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emoji:  { fontSize: 56, marginBottom: 16 },
  title:  { fontSize: 20, fontWeight: '700', color: DARK, marginBottom: 6, textAlign: 'center' },
  sub:    { fontSize: 14, color: MUTED, textAlign: 'center', marginBottom: 20 },
  detail: { fontSize: 11, color: MUTED, textAlign: 'center', marginBottom: 32, fontFamily: 'monospace' },
  btn:    { backgroundColor: PINK, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  btnTxt: { color: WHITE, fontWeight: '700', fontSize: 14 },
});
