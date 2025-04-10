import { createGlobalStyle } from "styled-components";
import { COLORS } from "./theme";

// Estilos globais da aplicação
const GlobalStyles = createGlobalStyle`
  :root {
    font-family: 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    line-height: 1.5;
    font-weight: 400;
    color: ${COLORS.text};
    
    /* Variáveis CSS para cores */
    --color-background: ${COLORS.background};
    --color-surface: ${COLORS.surface};
    --color-current: ${COLORS.current};
    --color-completed: ${COLORS.completed};
    --color-pending: ${COLORS.pending};
    --color-text: ${COLORS.text};
    --color-text-secondary: ${COLORS.textSecondary};
    --color-overlay: ${COLORS.overlay};
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    overflow-x: hidden;
  }

  /* Estilos para o texto das tarefas com base no status */
  .task-current {
    color: var(--color-current);
    font-weight: 600;
  }

  .task-completed {
    color: var(--color-completed);
  }

  .task-pending {
    color: var(--color-pending);
  }

  /* Animações de transição para componentes */
  .fade-enter {
    opacity: 0;
  }
  
  .fade-enter-active {
    opacity: 1;
    transition: opacity 200ms;
  }
  
  .fade-exit {
    opacity: 1;
  }
  
  .fade-exit-active {
    opacity: 0;
    transition: opacity 200ms;
  }
`;

export default GlobalStyles;
