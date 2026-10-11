import { useGame } from './GameContext';
import { MainMenu } from './screens/MenuScreen';
import { SetupScreen } from './screens/SetupScreen';
import { GameScreen } from './screens/GameScreen';
import { SummaryScreen } from './screens/SummaryScreen';
import { LoadScreen } from './screens/LoadScreen';

export default function App() {
  const { currentScreen } = useGame();

  switch (currentScreen) {
    case 'menu':
      return <MainMenu />;
    case 'setup':
      return <SetupScreen />;
    case 'game':
      return <GameScreen />;
    case 'summary':
      return <SummaryScreen />;
    case 'load':
      return <LoadScreen />;
    default:
      return <MainMenu />;
  }
}
