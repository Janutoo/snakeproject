import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, StyleSheet } from 'react-native';
import MenuScreen from './src/screens/MenuScreen';
import GameScreen from './src/screens/GameScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import { Screen, GameSettings } from './src/utils/types';
import { loadSettings, DEFAULT_SETTINGS } from './src/utils/storage';

export default function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [playerName, setPlayerName] = useState('');
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [lastScore, setLastScore] = useState<number | null>(null);

  useEffect(() => {
    loadSettings().then(setSettings);
  }, []);

  function handleGameOver(score: number) {
    setLastScore(score);
    setScreen('menu');
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      {screen === 'menu' && (
        <MenuScreen
          playerName={playerName}
          onNameChange={setPlayerName}
          onStartGame={() => setScreen('game')}
          onOpenSettings={() => setScreen('settings')}
          lastScore={lastScore}
        />
      )}
      {screen === 'game' && (
        <GameScreen
          key={`${playerName}-${settings.boardSize}-${settings.startLength}`}
          playerName={playerName}
          settings={settings}
          onGameOver={handleGameOver}
          onMenu={() => setScreen('menu')}
        />
      )}
      {screen === 'settings' && (
        <SettingsScreen
          settings={settings}
          onSave={setSettings}
          onBack={() => setScreen('menu')}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0d1117',
  },
});
