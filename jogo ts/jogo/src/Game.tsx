import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Alert,
} from 'react-native';

const { width } = Dimensions.get('window');

const COLORS = [
  '#FF3B30',
  '#34C759', 
  '#002fffff', 
  '#FFCC00', 
  '#b627fdff', 
  '#ff8800ff', 
  '#ff00bfff', 
  '#5AC8FA', 
];

const COLOR_NAMES: Record<string, string> = {
  '#FF3B30': 'vermelho',
  '#34C759': 'verde',
  '#002fffff': 'azul',
  '#FFCC00': 'amarelo',
  '#b627fdff': 'roxo',
  '#ff8800ff': 'laranja',
  '#ff00bfff': 'rosa',
  '#5AC8FA': 'ciano',
};

function randomDifferent(hex: string) {
  const choices = COLORS.filter((c) => c !== hex);
  return choices[Math.floor(Math.random() * choices.length)];
}

function randomChoice<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function Game() {
  const [target, setTarget] = useState<string>(randomChoice(COLORS));
  const [targetLabelHex, setTargetLabelHex] = useState<string>(() => randomDifferent(target));
  const [grid, setGrid] = useState<string[]>(() => generateGrid(target));
  const [score, setScore] = useState<number>(0);
  const [lives, setLives] = useState<number>(3);
  const [timeLimit, setTimeLimit] = useState<number>(2000); 
  const [timeLeft, setTimeLeft] = useState<number>(2000);
  const [gameOver, setGameOver] = useState<boolean>(false);

  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    startTimer();
    return () => stopTimer();
  }, [timeLimit]);

  useEffect(() => {
    if (timeLeft <= 0 && !gameOver) {
      handleMiss();
    }
  }, [timeLeft]);

  function generateGrid(currentTarget: string) {
    const size = 9;
    const result: string[] = [];
   
    const correctIndex = Math.floor(Math.random() * size);
    for (let i = 0; i < size; i++) {
      if (i === correctIndex) result.push(currentTarget);
      else result.push(randomChoice(COLORS));
    }
   
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function startTimer() {
    stopTimer();
    setTimeLeft(timeLimit);
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => Math.max(0, t - 100));
    }, 100) as unknown as number;
  }

  function stopTimer() {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function nextRound(increaseDifficulty = false) {
    const newTarget = randomChoice(COLORS);
    setTarget(newTarget);
    setTargetLabelHex(randomDifferent(newTarget));
    setGrid(generateGrid(newTarget));
    if (increaseDifficulty) {
      setTimeLimit((t) => Math.max(700, Math.round(t * 0.93)));
    }
    setTimeLeft((prev) => Math.max(0, Math.min(timeLimit, timeLimit)));
    // restart timer (timeLimit changed via state effect handles it)
    startTimer();
  }

  function handlePress(color: string) {
    if (gameOver) return;
    if (color === target) {
      const newScore = score + 1;
      setScore(newScore);
      // every 3 corrects, make it faster
      const makeHarder = newScore % 3 === 0;
      nextRound(makeHarder);
    } else {
      handleMiss();
    }
  }

  function handleMiss() {
    stopTimer();
    const newLives = lives - 1;
    setLives(newLives);
    if (newLives <= 0) {
      setGameOver(true);
      Alert.alert('Fim de jogo', `Pontuação final: ${score}`, [
        { text: 'Reiniciar', onPress: restart },
      ]);
      return;
    }
   
    setTimeout(() => {
      nextRound(false);
    }, 700);
  }

  function restart() {
    setScore(0);
    setLives(3);
    setTimeLimit(3000);
    setGameOver(false);
    const t = randomChoice(COLORS);
    setTarget(t);
    setTargetLabelHex(randomDifferent(t));
    setGrid(generateGrid(t));
    setTimeout(() => startTimer(), 200);
  }

  const boxSize = Math.floor((width - 60) / 3);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reflexo Rápido</Text>
        <View style={styles.statsRow}>
          <View style={styles.targetBox}>
            <Text style={styles.label}>Cor alvo</Text>
            <View style={[styles.swatch, { backgroundColor: target }]}> 
              <Text style={[styles.swatchLabel, { color: targetLabelHex }]}>{COLOR_NAMES[targetLabelHex].toUpperCase()}</Text>
            </View>
            <Text style={styles.hex}>{target}</Text>
          </View>
          <View style={styles.info}>
            <Text style={styles.infoText}>Pontuação: {score}</Text>
            <Text style={styles.infoText}>Vidas: {lives}</Text>
            <Text style={styles.infoText}>
              Tempo: {(timeLeft / 1000).toFixed(2)}s
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {grid.map((c, i) => (
          <TouchableOpacity
            key={`${c}-${i}`}
            style={[styles.colorBox, { backgroundColor: c, width: boxSize, height: boxSize }]}
            activeOpacity={0.8}
            onPress={() => handlePress(c)}
          />
        ))}
      </View>

      <View style={styles.footer}>
        {gameOver ? (
          <TouchableOpacity style={styles.button} onPress={restart}>
            <Text style={styles.buttonText}>Reiniciar</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.buttonSecondary} onPress={restart}>
            <Text style={styles.buttonTextSmall}>Reiniciar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 16,
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetBox: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    color: '#ddd',
    fontSize: 12,
  },
  swatch: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginVertical: 12,
    borderWidth: 2,
    borderColor: '#222',
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchLabel: {
    fontSize: 28,
    fontWeight: '800',
    textTransform: 'uppercase',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hex: {
    color: '#fff',
    fontSize: 12,
  },
  info: {
    alignItems: 'flex-end',
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  colorBox: {
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingBottom: 24,
  },
  button: {
    backgroundColor: '#34C759',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
  },
  buttonSecondary: {
    backgroundColor: '#333',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 8,
  },
  buttonTextSmall: {
    color: '#fff',
    fontWeight: '600',
  },
});
