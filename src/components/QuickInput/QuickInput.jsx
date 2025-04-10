import { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { X } from "lucide-react";
import { CSSTransition } from "react-transition-group";
import { useTaskContext } from "../../context/TaskContext";
import { COLORS } from "../../utils/theme";

const QuickInput = () => {
  const {
    quickInputVisible,
    toggleQuickInput,
    addTask,
    getCurrentDayTasks,
    updateTaskStatus,
  } = useTaskContext();

  const [inputValue, setInputValue] = useState("");
  const [showTaskCompletionPrompt, setShowTaskCompletionPrompt] =
    useState(false);
  const [previousTask, setPreviousTask] = useState(null);
  const inputRef = useRef(null);

  // Focar no input quando a interface abrir
  useEffect(() => {
    if (quickInputVisible && inputRef.current) {
      inputRef.current.focus();

      // Verificar se há uma tarefa atual para perguntar sobre conclusão
      const tasks = getCurrentDayTasks();
      const currentTask = tasks.find((task) => task.status === "current");

      if (currentTask) {
        setPreviousTask(currentTask);
        setShowTaskCompletionPrompt(true);
      } else {
        setShowTaskCompletionPrompt(false);
      }
    }
  }, [quickInputVisible, getCurrentDayTasks]);

  // Lidar com a submissão de tarefa
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    addTask(inputValue);
    setInputValue("");
    toggleQuickInput();
  };

  // Responder à pergunta sobre completude da tarefa anterior
  const handleTaskCompletionResponse = (isCompleted) => {
    if (previousTask) {
      if (isCompleted) {
        // Marcar a tarefa como concluída
        updateTaskStatus(previousTask.id, "completed", {
          note: "Tarefa concluída pelo usuário",
        });
      } else {
        // Perguntar pelo motivo da não conclusão
        const waitingFor = window.prompt("Quem precisa validar esta tarefa?");
        if (waitingFor) {
          updateTaskStatus(previousTask.id, "waiting-validation", {
            waitingFor,
            note: `Aguardando validação de: ${waitingFor}`,
          });
        } else {
          // Se não informou quem está aguardando, manter como atual
          // Não faz nada, mantém o status atual
        }
      }
    }

    setShowTaskCompletionPrompt(false);
  };

  // Se estiver mostrando o prompt de conclusão de tarefa
  if (quickInputVisible && showTaskCompletionPrompt && previousTask) {
    return (
      <CSSTransition
        in={quickInputVisible}
        timeout={200}
        classNames="fade"
        unmountOnExit
      >
        <Overlay>
          <PromptContainer>
            <PromptHeader>
              <h3>Tarefa Anterior</h3>
              <CloseButton onClick={toggleQuickInput}>
                <X size={20} />
              </CloseButton>
            </PromptHeader>

            <PromptContent>
              <p>Você concluiu a tarefa:</p>
              <PreviousTaskText>{previousTask.text}</PreviousTaskText>

              <PromptButtonGroup>
                <PromptButton
                  $isComplete
                  onClick={() => handleTaskCompletionResponse(true)}
                >
                  Sim, concluída
                </PromptButton>

                <PromptButton
                  $isPending
                  onClick={() => setShowTaskCompletionPrompt(false)}
                >
                  Aguardando validação
                </PromptButton>

                <PromptButton
                  $isCancel
                  onClick={() => setShowTaskCompletionPrompt(false)}
                >
                  Não, manter em andamento
                </PromptButton>
              </PromptButtonGroup>
            </PromptContent>
          </PromptContainer>
        </Overlay>
      </CSSTransition>
    );
  }

  // Interface principal de entrada de tarefa
  return (
    <CSSTransition
      in={quickInputVisible}
      timeout={200}
      classNames="fade"
      unmountOnExit
    >
      <Overlay>
        <InputContainer>
          <InputHeader>
            <h3>Nova Tarefa</h3>
            <CloseButton onClick={toggleQuickInput}>
              <X size={20} />
            </CloseButton>
          </InputHeader>

          <InputForm onSubmit={handleSubmit}>
            <TaskInput
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="O que você está fazendo agora?"
              autoFocus
            />
            <SubmitButton type="submit">Adicionar</SubmitButton>
          </InputForm>

          <InputFooter>
            <ShortcutInfo>
              Pressione Enter para adicionar ou Esc para cancelar
            </ShortcutInfo>
          </InputFooter>
        </InputContainer>
      </Overlay>
    </CSSTransition>
  );
};

// Componentes estilizados
const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: ${COLORS.overlay};
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const InputContainer = styled.div`
  background-color: ${COLORS.surface};
  border-radius: 8px;
  width: 550px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
`;

const InputHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  h3 {
    color: ${COLORS.text};
    font-size: 18px;
    font-weight: 500;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;

  &:hover {
    color: ${COLORS.text};
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const InputForm = styled.form`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TaskInput = styled.input`
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: ${COLORS.text};
  font-size: 16px;
  padding: 12px 16px;
  border-radius: 4px;
  width: 100%;
  outline: none;

  &:focus {
    border-color: rgba(0, 255, 127, 0.6);
    box-shadow: 0 0 0 2px rgba(0, 255, 127, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const SubmitButton = styled.button`
  background-color: ${COLORS.current};
  color: #000;
  font-weight: 600;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #00cc63;
  }
`;

const InputFooter = styled.div`
  padding: 8px 16px 16px;
  display: flex;
  justify-content: center;
`;

const ShortcutInfo = styled.span`
  color: ${COLORS.textSecondary};
  font-size: 13px;
`;

// Estilos para o prompt de conclusão de tarefa
const PromptContainer = styled(InputContainer)``;

const PromptHeader = styled(InputHeader)``;

const PromptContent = styled.div`
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;

  p {
    color: ${COLORS.textSecondary};
  }
`;

const PreviousTaskText = styled.div`
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  color: ${COLORS.text};
  font-weight: 500;
  border-left: 3px solid ${COLORS.current};
`;

const PromptButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
`;

const PromptButton = styled.button`
  padding: 12px;
  border-radius: 4px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  font-size: 15px;

  background-color: ${(props) =>
    props.$isComplete
      ? COLORS.current
      : props.$isPending
      ? COLORS.pending
      : "rgba(255, 255, 255, 0.1)"};

  color: ${(props) =>
    props.$isComplete || props.$isPending ? "#000" : COLORS.text};

  &:hover {
    filter: brightness(1.1);
  }
`;

export default QuickInput;
