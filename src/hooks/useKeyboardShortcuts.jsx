import { useHotkeys } from "react-hotkeys-hook";
import { useTaskContext } from "../context/TaskContext";

const useKeyboardShortcuts = () => {
  // Obtenha o contexto sem verificações condicionais
  const context = useTaskContext();

  // Use valores padrão se o contexto não estiver disponível
  const toggleQuickInput =
    context?.toggleQuickInput ||
    (() => console.warn("toggleQuickInput não disponível"));
  const toggleDashboard =
    context?.toggleDashboard ||
    (() => console.warn("toggleDashboard não disponível"));
  const quickInputVisible = context?.quickInputVisible || false;
  const dashboardVisible = context?.dashboardVisible || false;

  // Atalho para abrir a interface de entrada rápida (Alt+Enter ou Ctrl+Enter)
  useHotkeys(
    ["alt+enter", "ctrl+enter"],
    (event) => {
      event.preventDefault();
      if (dashboardVisible) {
        toggleDashboard();
      }
      toggleQuickInput();
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA"] }
  );

  // Atalho para abrir o dashboard/painel de controle (Alt+D)
  useHotkeys(
    "alt+d",
    (event) => {
      event.preventDefault();
      if (quickInputVisible) {
        toggleQuickInput();
      }
      toggleDashboard();
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA"] }
  );

  // Atalho para fechar qualquer interface (Escape)
  useHotkeys(
    "escape",
    () => {
      if (quickInputVisible) {
        toggleQuickInput();
      }
      if (dashboardVisible) {
        toggleDashboard();
      }
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA"] }
  );

  return null;
};

export default useKeyboardShortcuts;
