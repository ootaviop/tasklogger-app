import { TaskProvider } from "./context/TaskContext";
import GlobalStyles from "./utils/GlobalStyles";
import QuickInput from "./components/QuickInput/QuickInput";
import TaskHUD from "./components/HUD/TaskHUD";
import Dashboard from "./components/Dashboard/Dashboard";
import useKeyboardShortcuts from "./hooks/useKeyboardShortcuts";
import styled from "styled-components";

function App() {
  return (
    <TaskProvider>
      <AppContainer>
        <GlobalStyles />
        <AppContent>
          <QuickInput />
          <TaskHUD />
          <Dashboard />
          <KeyboardShortcutsHandler />
        </AppContent>
      </AppContainer>
    </TaskProvider>
  );
}

// Componente separado para os atalhos
const KeyboardShortcutsHandler = () => {
  useKeyboardShortcuts();
  return null;
};

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  background-color: var(--color-background);
`;

const AppContent = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`;

export default App;
