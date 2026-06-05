import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { GameSettings } from '../utils/types';
import { saveSettings } from '../utils/storage';

interface Props {
  settings: GameSettings;
  onSave: (s: GameSettings) => void;
  onBack: () => void;
}

function Stepper({
  label,
  description,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <View style={styles.stepperRow}>
      <View style={styles.stepperInfo}>
        <Text style={styles.stepperLabel}>{label}</Text>
        <Text style={styles.stepperDesc}>{description}</Text>
      </View>
      <View style={styles.stepperControls}>
        <TouchableOpacity
          style={[styles.stepBtn, value <= min && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.max(min, value - step))}
          activeOpacity={0.7}
        >
          <Text style={styles.stepBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.stepValue}>
          {value}
          <Text style={styles.stepUnit}> {unit}</Text>
        </Text>
        <TouchableOpacity
          style={[styles.stepBtn, value >= max && styles.stepBtnDisabled]}
          onPress={() => onChange(Math.min(max, value + step))}
          activeOpacity={0.7}
        >
          <Text style={styles.stepBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function SettingsScreen({ settings, onSave, onBack }: Props) {
  const [local, setLocal] = useState<GameSettings>({ ...settings });

  function update<K extends keyof GameSettings>(key: K, value: GameSettings[K]) {
    setLocal((prev) => ({ ...prev, [key]: value }));
  }

  function handleSave() {
    saveSettings(local);
    onSave(local);
    onBack();
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Wróć</Text>
        </TouchableOpacity>
        <Text style={styles.title}>⚙  Ustawienia</Text>
        <View style={{ width: 60 }} />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Plansza</Text>
        <Stepper
          label="Rozmiar planszy"
          description="Liczba kratek w każdym wierszu i kolumnie"
          value={local.boardSize}
          min={10}
          max={30}
          step={2}
          unit="kratek"
          onChange={(v) => update('boardSize', v)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Wąż</Text>
        <Stepper
          label="Startowa długość ogona"
          description="Liczba kwadracików na starcie gry"
          value={local.startLength}
          min={3}
          max={15}
          step={1}
          unit="kwadraciki"
          onChange={(v) => update('startLength', v)}
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Owocki</Text>
        <Stepper
          label="Opóźnienie owocka"
          description="Czas, po którym pojawia się nowy owocek po zjedzeniu"
          value={local.fruitDelay}
          min={3}
          max={30}
          step={1}
          unit="sek"
          onChange={(v) => update('fruitDelay', v)}
        />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveBtnText}>Zapisz ustawienia</Text>
      </TouchableOpacity>

      {/* Preview info */}
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Podgląd ustawień</Text>
        <Text style={styles.previewText}>
          Plansza: {local.boardSize} × {local.boardSize} kratek{'\n'}
          Startowy ogon: {local.startLength} kwadraciki{'\n'}
          Nowy owocek po: {local.fruitDelay} sekundach
        </Text>
      </View>
    </ScrollView>
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
  scroll: {
    flex: 1,
    backgroundColor: DARK_BG,
  },
  container: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 60,
  },
  backText: {
    color: ACCENT,
    fontSize: 15,
    fontWeight: '600',
  },
  title: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  card: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperInfo: {
    flex: 1,
    marginRight: 12,
  },
  stepperLabel: {
    color: TEXT,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  stepperDesc: {
    color: MUTED,
    fontSize: 11,
    lineHeight: 15,
  },
  stepperControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepBtn: {
    backgroundColor: '#21262d',
    borderRadius: 8,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: BORDER,
  },
  stepBtnDisabled: {
    opacity: 0.3,
  },
  stepBtnText: {
    color: TEXT,
    fontSize: 20,
    fontWeight: '300',
    lineHeight: 22,
  },
  stepValue: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: '700',
    minWidth: 50,
    textAlign: 'center',
  },
  stepUnit: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '400',
  },
  saveBtn: {
    backgroundColor: GREEN,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  saveBtnText: {
    color: '#0d1117',
    fontSize: 16,
    fontWeight: '800',
  },
  preview: {
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  previewTitle: {
    color: MUTED,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  previewText: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 22,
  },
});
