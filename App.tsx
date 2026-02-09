
import React, { useState, useEffect, useCallback } from 'react';
import { GameState, PlayerStats, GameMetrics } from './types';
import { StartScreen } from './components/StartScreen';
import { InstructionScreen } from './components/InstructionScreen';
import { Level1 } from './components/Level1';
import { Level2 } from './components/Level2';
import { Level3 } from './components/Level3';
import { ResultScreen } from './components/ResultScreen';
import { HUD } from './components/HUD';
import { BENGALI_STRINGS, LEVEL_TIMEOUTS } from './constants';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from './audioUtils';

const INITIAL_STATS: PlayerStats = {
  stamina: 100,
  fear: 10,
  frustration: 0
};

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.START);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [metrics, setMetrics] = useState<GameMetrics>({
    timeElapsed: 0,
    failures: 0,
    bribesTaken: 0,
    survived: false
  });
  const [currentLevelTimer, setCurrentLevelTimer] = useState(0);
  const [disableHome, setDisableHome] = useState(false);

  const updateGlobalStats = useCallback((newStats: PlayerStats) => {
    setStats(newStats);
    // Update the procedural BGM modulation based on fear and frustration
    audio.updateBGM(newStats.fear, newStats.frustration);
  }, []);

  const handleLevelFail = useCallback(() => {
    audio.playAlarm();
    audio.stopBGM();
    // Loud voiceover for failure
    audio.speak("ঘাট কাউকে অপেক্ষা করে না। আপনি পরাজিত হয়েছেন। আবার চেষ্টা করুন!", "system");
    setMetrics(prev => ({ ...prev, failures: prev.failures + 1, survived: false }));
    setGameState(GameState.RESULT);
    setDisableHome(false);
  }, []);

  const handleStart = () => {
    audio.init();
    audio.playClick();
    setGameState(GameState.INSTRUCTIONS);
  };

  const handleBeginJourney = useCallback(() => {
    audio.init();
    audio.playClick();
    audio.startBGM();
    setGameState(GameState.LEVEL_1);
    setCurrentLevelTimer(LEVEL_TIMEOUTS.LEVEL_1);
    setStats(INITIAL_STATS);
    setMetrics({ timeElapsed: 0, failures: 0, bribesTaken: 0, survived: false });
    setDisableHome(false);
  }, []);

  const handleGoHome = useCallback(() => {
    audio.playClick();
    audio.stopBGM();
    setGameState(GameState.START);
    setDisableHome(false);
  }, []);

  const handleLevel1Complete = useCallback((newStats: PlayerStats, bribe: boolean) => {
    audio.playClick();
    setStats(newStats);
    setMetrics(prev => ({
      ...prev,
      bribesTaken: prev.bribesTaken + (bribe ? 1 : 0),
      timeElapsed: prev.timeElapsed + (LEVEL_TIMEOUTS.LEVEL_1 - currentLevelTimer)
    }));
    setGameState(GameState.LEVEL_2);
    setCurrentLevelTimer(LEVEL_TIMEOUTS.LEVEL_2);
  }, [currentLevelTimer]);

  const handleLevel2Complete = useCallback((newStats: PlayerStats) => {
    audio.playClick();
    setStats(newStats);
    setMetrics(prev => ({
      ...prev,
      timeElapsed: prev.timeElapsed + (LEVEL_TIMEOUTS.LEVEL_2 - currentLevelTimer)
    }));
    setGameState(GameState.LEVEL_3);
    setCurrentLevelTimer(LEVEL_TIMEOUTS.LEVEL_3);
  }, [currentLevelTimer]);

  const handleLevel3Complete = useCallback((newStats: PlayerStats) => {
    audio.playClick();
    audio.stopBGM();
    // Loud celebratory voiceover for reaching Sandwip
    // Fixed: Use BENGALI_STRINGS.successful_return instead of BENGALI_STRINGS.greetings_sandwip
    const successText = BENGALI_STRINGS.success_msg + " " + BENGALI_STRINGS.successful_return;
    audio.speak(successText, "system");
    setStats(newStats);
    setMetrics(prev => ({
      ...prev,
      timeElapsed: prev.timeElapsed + (LEVEL_TIMEOUTS.LEVEL_3 - currentLevelTimer),
      survived: true
    }));
    setGameState(GameState.RESULT);
    setDisableHome(false);
  }, [currentLevelTimer]);

  useEffect(() => {
    if (gameState === GameState.START || gameState === GameState.RESULT || gameState === GameState.INSTRUCTIONS) return;

    const interval = setInterval(() => {
      setCurrentLevelTimer(prev => {
        if (prev <= 0) return 0;
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState]);

  const renderContent = () => {
    switch (gameState) {
      case GameState.START:
        return <StartScreen onStart={handleStart} onDirectPlay={handleBeginJourney} />;
      case GameState.INSTRUCTIONS:
        return <InstructionScreen onNext={handleBeginJourney} />;
      case GameState.LEVEL_1:
        return (
          <Level1
            initialStats={stats}
            updateGlobalStats={updateGlobalStats}
            onComplete={handleLevel1Complete}
            onFail={handleLevelFail}
          />
        );
      case GameState.LEVEL_2:
        return (
          <Level2
            initialStats={stats}
            updateGlobalStats={updateGlobalStats}
            onComplete={handleLevel2Complete}
            onFail={handleLevelFail}
          />
        );
      case GameState.LEVEL_3:
        return (
          <Level3
            initialStats={stats}
            updateGlobalStats={updateGlobalStats}
            onComplete={handleLevel3Complete}
            onFail={handleLevelFail}
            setDisableHome={setDisableHome}
          />
        );
      case GameState.RESULT:
        return (
          <ResultScreen
            metrics={metrics}
            stats={stats}
            onRestart={handleBeginJourney}
            onHome={handleGoHome}
          />
        );
      default:
        return <StartScreen onStart={handleStart} onDirectPlay={handleBeginJourney} />;
    }
  };

  const getLevelName = () => {
    switch (gameState) {
      case GameState.LEVEL_1: return BENGALI_STRINGS.level1_name;
      case GameState.LEVEL_2: return BENGALI_STRINGS.level2_name;
      case GameState.LEVEL_3: return BENGALI_STRINGS.level3_name;
      case GameState.INSTRUCTIONS: return "Journey Preparation";
      default: return "";
    }
  };

  const getLevelIndex = () => {
    switch (gameState) {
      case GameState.LEVEL_1: return 1;
      case GameState.LEVEL_2: return 2;
      case GameState.LEVEL_3: return 3;
      default: return 0;
    }
  };

  const showHUD = gameState !== GameState.START && gameState !== GameState.RESULT;
  const isGameplay = gameState === GameState.LEVEL_1 || gameState === GameState.LEVEL_2 || gameState === GameState.LEVEL_3;

  return (
    <div className="min-h-screen bg-[#020617] text-white selection:bg-blue-500/30 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-black pointer-events-none" />
      <AnimatePresence mode="wait">
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="relative h-full z-10"
        >
          {showHUD && (
            <HUD
              stats={stats}
              timer={currentLevelTimer}
              levelName={getLevelName()}
              onHome={handleGoHome}
              disableHome={disableHome}
              showStats={isGameplay}
              level={getLevelIndex()}
            />
          )}
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default App;
