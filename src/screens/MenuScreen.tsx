import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { getBestScore } from '../utils/storage';

interface Props {
  playerName: string;
  onNameChange: (name: string) => void;
  onStartGame: () => void;
  onOpenSettings: () => void;
  lastScore: number | null;
}

export default function MenuScreen({
  playerName,
  onNameChange,
  onStartGame,
  onOpenSettings,
  lastScore,
}: Props) {
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    if (playerName.trim()) {
      getBestScore(playerName.trim()).then(setBestScore);
    }
  }, [playerName, lastScore]);

  const canPlay = playerName.trim().length > 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Title */}
      <View style={styles.titleSection}>
        <Text style={styles.emoji}>🐍</Text>
        <Text style={styles.title}>SNAKE</Text>
        <Text style={styles.subtitle}>Classic Nokia Snake</Text>
      </View>

      {/* Name input */}
      <View style={styles.card}>
        <Text style={styles.label}>Twoje imię</Text>
        <TextInput
          style={styles.input}
          value={playerName}
          onChangeText={onNameChange}
          placeholder="Wpisz imię..."
          placeholderTextColor="#484f58"
          maxLength={20}
          autoCorrect={false}
        />
        {playerName.trim().length > 0 && (
          <View style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>Twój rekord:</Text>
            <Text style={styles.scoreValue}>{bestScore} 🍎</Text>
          </View>
        )}
        {lastScore !== null && (
          <View style={styles.lastScoreRow}>
            <Text style={styles.lastScoreLabel}>Ostatni wynik:</Text>
            <Text style={styles.lastScoreValue}>{lastScore} 🍎</Text>
          </View>
        )}
      </View>

      {/* Buttons */}
      <View style={styles.buttonSection}>
        <TouchableOpacity
          style={[styles.btn, styles.btnPrimary, !canPlay && styles.btnDisabled]}
          onPress={canPlay ? onStartGame : undefined}
          activeOpacity={canPlay ? 0.7 : 1}
        >
          <Text style={styles.btnPrimaryText}>
            {canPlay ? '▶  Graj' : 'Wpisz imię, aby grać'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnSecondary]}
          onPress={onOpenSettings}
          activeOpacity={0.7}
        >
          <Text style={styles.btnSecondaryText}>⚙  Ustawienia</Text>
        </TouchableOpacity>
      </View>

      {/* How to play */}
      <View style={styles.howTo}>
        <Text style={styles.howToTitle}>Jak grać</Text>
        <Text style={styles.howToText}>
          Tapnij lewą / prawą / górną / dolną część planszy,{'\n'}
          aby zmienić kierunek ruchu węża.{'\n'}
          Jedz 🍎 i unikaj własnego ogona!
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const DARK_BG = '#0d1117';
const CARD_BG = '#161b22';
const BORDER = '#30363d';
const TEXT = '#e6edf3';
const ACCENT = '#58a6ff';
const GREEN = '#39d353';
const MUTED = '#8b949e';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DARK_BG,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emoji: {
    fontSize: 52,
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontWeight: '900',
    color: GREEN,
    letterSpacing: 8,
  },
  subtitle: {
    fontSize: 13,
    color: MUTED,
    letterSpacing: 2,
    marginTop: 4,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 20,
    width: '100%',
    marginBottom: 20,
  },
  label: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: DARK_BG,
    color: TEXT,
    fontSize: 18,
    fontWeight: '600',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  scoreLabel: {
    color: MUTED,
    fontSize: 14,
  },
  scoreValue: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: '700',
  },
  lastScoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  lastScoreLabel: {
    color: MUTED,
    fontSize: 13,
  },
  lastScoreValue: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonSection: {
    width: '100%',
    gap: 12,
    marginBottom: 28,
  },
  btn: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimary: {
    backgroundColor: GREEN,
  },
  btnDisabled: {
    backgroundColor: '#1c3a26',
  },
  btnPrimaryText: {
    color: '#0d1117',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  btnSecondary: {
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  btnSecondaryText: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '600',
  },
  howTo: {
    alignItems: 'center',
  },
  howToTitle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  howToText: {
    color: '#484f58',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
