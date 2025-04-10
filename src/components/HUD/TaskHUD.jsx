import { useState } from "react";
import styled from "styled-components";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useTaskContext, TASK_STATUS } from "../../context/TaskContext";
import { COLORS } from "../../utils/theme";

const TaskHUD = () => {
  const { getCurrentDayTasks, toggleQuickInput, toggleDashboard } =
    useTaskContext();
  const [expanded, setExpanded] = useState(false);

  const tasks = getCurrentDayTasks();
  const currentTask = tasks.find((task) => task.status === TASK_STATUS.CURRENT);
  const recentTasks = tasks
    .filter((task) => task.status !== TASK_STATUS.CURRENT)
    .sort((a, b) => {
      // Ordenar por timestamp, mais recentes primeiro
      return b.timestamp.localeCompare(a.timestamp);
    })
    .slice(0, expanded ? undefined : 3); // Se expandido, mostrar todos, senão apenas os 3 mais recentes

  const toggleExpanded = () => {
    setExpanded((prevExpanded) => !prevExpanded);
  };

  return (
    <HUDContainer>
      <HUDHeader>
        <ExpandToggle onClick={toggleExpanded}>
          {expanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </ExpandToggle>

        <DashboardButton onClick={toggleDashboard}>
          Ver todos os dias
        </DashboardButton>
      </HUDHeader>

      <TasksContainer $expanded={expanded}>
        {currentTask ? (
          <CurrentTask>
            <TaskTime>{currentTask.timestamp}</TaskTime>
            <TaskText $status={currentTask.status}>{currentTask.text}</TaskText>
          </CurrentTask>
        ) : (
          <EmptyStateMessage onClick={toggleQuickInput}>
            Clique para adicionar uma tarefa
            <KeyboardShortcut>Alt+Enter</KeyboardShortcut>
          </EmptyStateMessage>
        )}

        {recentTasks.length > 0 && (
          <RecentTasksList>
            {recentTasks.map((task) => (
              <TaskItem key={task.id}>
                <TaskTime>{task.timestamp}</TaskTime>
                <TaskText $status={task.status}>
                  {task.text}
                  {task.dependencies && (
                    <TaskDependency>{`[${task.dependencies.description}]`}</TaskDependency>
                  )}
                </TaskText>
              </TaskItem>
            ))}
          </RecentTasksList>
        )}

        {!expanded && tasks.length > 4 && (
          <MoreTasksIndicator onClick={toggleExpanded}>
            +{tasks.length - 4} mais tarefas
          </MoreTasksIndicator>
        )}
      </TasksContainer>

      <AddTaskButton onClick={toggleQuickInput}>+ Nova Tarefa</AddTaskButton>
    </HUDContainer>
  );
};

// Componentes estilizados
const HUDContainer = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 300px;
  background-color: ${COLORS.surface};
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  z-index: 100;
  max-height: calc(100vh - 40px);
`;

const HUDHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ExpandToggle = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: ${COLORS.text};
  }
`;

const DashboardButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: ${COLORS.text};
  }
`;

const TasksContainer = styled.div`
  overflow-y: auto;
  max-height: ${(props) => (props.$expanded ? "400px" : "250px")};
  transition: max-height 0.3s ease;
`;

const CurrentTask = styled.div`
  padding: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 255, 127, 0.1);
`;

const RecentTasksList = styled.div`
  display: flex;
  flex-direction: column;
`;

const TaskItem = styled.div`
  padding: 10px 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const TaskTime = styled.span`
  font-size: 11px;
  color: ${COLORS.textSecondary};
  display: block;
  margin-bottom: 2px;
`;

const TaskText = styled.div`
  color: ${(props) => {
    switch (props.$status) {
      case TASK_STATUS.CURRENT:
        return COLORS.current;
      case TASK_STATUS.COMPLETED:
        return COLORS.completed;
      case TASK_STATUS.WAITING_VALIDATION:
        return COLORS.pending;
      case TASK_STATUS.NEEDS_ADJUSTMENT:
        return COLORS.pending;
      case TASK_STATUS.PAUSED:
        return COLORS.pending;
      default:
        return COLORS.text;
    }
  }};

  font-weight: ${(props) =>
    props.$status === TASK_STATUS.CURRENT ? "600" : "400"};
  font-size: 14px;
  word-break: break-word;
`;

const TaskDependency = styled.span`
  color: ${COLORS.textSecondary};
  font-style: italic;
  margin-left: 4px;
  font-size: 12px;
`;

const MoreTasksIndicator = styled.div`
  text-align: center;
  padding: 8px;
  color: ${COLORS.textSecondary};
  font-size: 12px;
  cursor: pointer;
  background-color: rgba(255, 255, 255, 0.05);

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: ${COLORS.text};
  }
`;

const AddTaskButton = styled.button`
  padding: 10px;
  background-color: rgba(0, 255, 127, 0.2);
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  color: ${COLORS.current};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background-color: rgba(0, 255, 127, 0.3);
  }
`;

const EmptyStateMessage = styled.div`
  padding: 16px;
  text-align: center;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;

  &:hover {
    color: ${COLORS.text};
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const KeyboardShortcut = styled.span`
  font-size: 11px;
  padding: 2px 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: ${COLORS.textSecondary};
`;

export default TaskHUD;
