import { COLORS } from "../../utils/theme";
import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import {
  format,
  parse,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { CSSTransition } from "react-transition-group";
import { useTaskContext } from "../../context/TaskContext";

const Dashboard = () => {
  const {
    dashboardVisible,
    toggleDashboard,
    days,
    setCurrentDay,
    currentDay,
    getPendingTasks,
    addNewDay,
    getStats,
  } = useTaskContext();

  const [activeTab, setActiveTab] = useState("days");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState([]);
  const [statistics, setStatistics] = useState(null);

  // Calcular as tarefas pendentes apenas quando 'days' mudar (otimizado)
  const pendingTasks = useMemo(() => getPendingTasks(), [getPendingTasks]);

  // Carregar dias do mês atual para o calendário
  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    // Gerar todos os dias do mês
    const daysInMonth = eachDayOfInterval({ start, end });
    setCalendarDays(daysInMonth);

    // Calcular estatísticas do mês
    const statsForMonth = getStats(
      format(start, "yyyy-MM-dd"),
      format(end, "yyyy-MM-dd")
    );
    setStatistics(statsForMonth);
  }, [currentMonth, days, getStats]);

  // Mudar para o próximo mês
  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Voltar para o mês anterior
  const goToPrevMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1));
  };

  // Verificar se um dia tem tarefas
  const dayHasTasks = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return days.some((day) => day.date === dateStr);
  };

  // Selecionar um dia específico - CORRIGIDO
  const selectDay = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    const dayIndex = days.findIndex((day) => day.date === dateStr);

    if (dayIndex >= 0) {
      setCurrentDay(dayIndex);
      // Ao selecionar um dia, fechar o dashboard
      toggleDashboard();
    } else {
      // Se o dia não existir, criá-lo e então definir o índice correto
      const success = addNewDay(dateStr);
      if (success) {
        // Usar o comprimento atual após adicionar o novo dia
        setCurrentDay(days.length);
        toggleDashboard();
      }
    }
  };

  // Renderizar a aba de dias
  const renderDaysTab = () => (
    <TabContent>
      <MonthNavigation>
        <MonthButton onClick={goToPrevMonth}>
          <ChevronLeft size={18} />
        </MonthButton>

        <MonthLabel>
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </MonthLabel>

        <MonthButton onClick={goToNextMonth}>
          <ChevronRight size={18} />
        </MonthButton>
      </MonthNavigation>

      <CalendarHeader>
        <WeekdayLabel>Dom</WeekdayLabel>
        <WeekdayLabel>Seg</WeekdayLabel>
        <WeekdayLabel>Ter</WeekdayLabel>
        <WeekdayLabel>Qua</WeekdayLabel>
        <WeekdayLabel>Qui</WeekdayLabel>
        <WeekdayLabel>Sex</WeekdayLabel>
        <WeekdayLabel>Sáb</WeekdayLabel>
      </CalendarHeader>

      <CalendarGrid>
        {calendarDays.map((day, index) => {
          // Verificar se o dia é o atual
          const isCurrentSelectedDay =
            days[currentDay] &&
            days[currentDay].date === format(day, "yyyy-MM-dd");

          // Verificar se o dia tem tarefas
          const hasTasksForDay = dayHasTasks(day);

          return (
            <CalendarDay
              key={index}
              onClick={() => selectDay(day)}
              $isCurrentDay={isCurrentSelectedDay}
              $hasTasks={hasTasksForDay}
            >
              {format(day, "d")}
            </CalendarDay>
          );
        })}
      </CalendarGrid>

      {statistics && (
        <StatsSection>
          <StatsHeader>Estatísticas do Mês</StatsHeader>
          <StatItem>
            <StatLabel>Total de tarefas:</StatLabel>
            <StatValue>{statistics.totalTasks}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Tarefas concluídas:</StatLabel>
            <StatValue>{statistics.completedTasks}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Tarefas pendentes:</StatLabel>
            <StatValue>{statistics.pendingTasks}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Taxa de conclusão:</StatLabel>
            <StatValue>{statistics.completionRate.toFixed(1)}%</StatValue>
          </StatItem>
        </StatsSection>
      )}
    </TabContent>
  );

  // Renderizar a aba de tarefas pendentes
  const renderPendingTab = () => (
    <TabContent>
      <PendingHeader>
        <h3>Tarefas Aguardando Ação</h3>
        {pendingTasks.length === 0 && (
          <NoPendingMessage>
            <AlertCircle size={18} />
            Nenhuma tarefa pendente
          </NoPendingMessage>
        )}
      </PendingHeader>

      {pendingTasks.map((dayGroup, index) => (
        <PendingDayGroup key={index}>
          <PendingDayHeader
            onClick={() => {
              setCurrentDay(dayGroup.dayIndex);
              toggleDashboard(); // Fechar o dashboard após selecionar um dia
            }}
          >
            {format(
              parse(dayGroup.date, "yyyy-MM-dd", new Date()),
              "dd 'de' MMMM 'de' yyyy",
              { locale: ptBR }
            )}
          </PendingDayHeader>

          <PendingTasksList>
            {dayGroup.tasks.map((task) => (
              <PendingTaskItem key={task.id} $status={task.status}>
                <PendingTaskTime>{task.timestamp}</PendingTaskTime>
                <PendingTaskText>
                  {task.text}
                  {task.dependencies && (
                    <PendingTaskDependency>
                      [{task.dependencies.description}]
                    </PendingTaskDependency>
                  )}
                </PendingTaskText>
                <PendingTaskStatus $status={task.status}>
                  {task.status === "waiting-validation"
                    ? "Aguardando Validação"
                    : task.status === "needs-adjustment"
                    ? "Precisa de Ajustes"
                    : task.status === "paused"
                    ? "Pausada"
                    : "Pendente"}
                </PendingTaskStatus>
              </PendingTaskItem>
            ))}
          </PendingTasksList>
        </PendingDayGroup>
      ))}
    </TabContent>
  );

  // Renderizar o dashboard completo
  return (
    <CSSTransition
      in={dashboardVisible}
      timeout={300}
      classNames="fade"
      unmountOnExit
    >
      <Overlay>
        <DashboardContainer>
          <DashboardHeader>
            <TabsContainer>
              <Tab
                $isActive={activeTab === "days"}
                onClick={() => setActiveTab("days")}
              >
                <Calendar size={16} />
                Calendário
              </Tab>
              <Tab
                $isActive={activeTab === "pending"}
                onClick={() => setActiveTab("pending")}
                $hasPending={pendingTasks.length > 0}
              >
                <AlertCircle size={16} />
                Pendentes (
                {pendingTasks.reduce((sum, day) => sum + day.tasks.length, 0)})
              </Tab>
            </TabsContainer>

            <CloseButton onClick={toggleDashboard}>
              <X size={20} />
            </CloseButton>
          </DashboardHeader>

          {activeTab === "days" && renderDaysTab()}
          {activeTab === "pending" && renderPendingTab()}
        </DashboardContainer>
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

const DashboardContainer = styled.div`
  background-color: ${COLORS.surface};
  border-radius: 8px;
  width: 600px;
  max-width: 90%;
  max-height: 90vh;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 8px;
`;

const Tab = styled.button`
  background: ${(props) =>
    props.$isActive ? "rgba(255, 255, 255, 0.1)" : "transparent"};
  color: ${(props) => (props.$isActive ? COLORS.text : COLORS.textSecondary)};
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;

  ${(props) =>
    props.$hasPending &&
    !props.$isActive &&
    `
    color: ${COLORS.pending};
  `}

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
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

const TabContent = styled.div`
  padding: 16px;
  overflow-y: auto;
  max-height: calc(90vh - 70px);
`;

const MonthNavigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const MonthButton = styled.button`
  background: none;
  border: none;
  color: ${COLORS.textSecondary};
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 4px;

  &:hover {
    color: ${COLORS.text};
    background-color: rgba(255, 255, 255, 0.1);
  }
`;

const MonthLabel = styled.div`
  color: ${COLORS.text};
  font-size: 18px;
  font-weight: 500;
  text-transform: capitalize;
`;

const CalendarHeader = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 8px;
`;

const WeekdayLabel = styled.div`
  color: ${COLORS.textSecondary};
  font-size: 14px;
  text-align: center;
  padding: 8px 0;
`;

const CalendarGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
`;

const CalendarDay = styled.div`
  color: ${(props) => (props.$isCurrentDay ? "#000" : COLORS.text)};
  background-color: ${(props) => {
    if (props.$isCurrentDay) return COLORS.current;
    if (props.$hasTasks) return "rgba(255, 255, 255, 0.1)";
    return "transparent";
  }};
  border: 1px solid
    ${(props) =>
      props.$hasTasks
        ? "rgba(255, 255, 255, 0.2)"
        : "rgba(255, 255, 255, 0.05)"};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px 0;
  font-weight: ${(props) => (props.$isCurrentDay ? "600" : "400")};
  cursor: pointer;

  &:hover {
    background-color: ${(props) =>
      props.$isCurrentDay ? COLORS.current : "rgba(255, 255, 255, 0.2)"};
  }
`;

const StatsSection = styled.div`
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatsHeader = styled.h3`
  color: ${COLORS.text};
  font-size: 16px;
  margin-bottom: 12px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const StatLabel = styled.span`
  color: ${COLORS.textSecondary};
`;

const StatValue = styled.span`
  color: ${COLORS.text};
  font-weight: 500;
`;

// Estilização para a aba de tarefas pendentes
const PendingHeader = styled.div`
  margin-bottom: 16px;

  h3 {
    color: ${COLORS.text};
    font-size: 18px;
    margin-bottom: 8px;
  }
`;

const NoPendingMessage = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: ${COLORS.textSecondary};
  font-style: italic;
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
`;

const PendingDayGroup = styled.div`
  margin-bottom: 20px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const PendingDayHeader = styled.div`
  color: ${COLORS.text};
  font-weight: 500;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 8px;
  cursor: pointer;

  &:hover {
    color: ${COLORS.current};
  }
`;

const PendingTasksList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PendingTaskItem = styled.div`
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
  border-left: 3px solid
    ${(props) => {
      switch (props.$status) {
        case "waiting-validation":
          return COLORS.pending;
        case "needs-adjustment":
          return COLORS.completed;
        case "paused":
          return "#6A5ACD"; // Cor para tarefas pausadas
        default:
          return COLORS.textSecondary;
      }
    }};
`;

const PendingTaskTime = styled.div`
  font-size: 12px;
  color: ${COLORS.textSecondary};
  margin-bottom: 4px;
`;

const PendingTaskText = styled.div`
  color: ${COLORS.text};
  margin-bottom: 8px;
  word-break: break-word;
`;

const PendingTaskDependency = styled.span`
  color: ${COLORS.textSecondary};
  font-style: italic;
  margin-left: 4px;
  font-size: 13px;
`;

const PendingTaskStatus = styled.div`
  display: inline-block;
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: rgba(0, 0, 0, 0.2);
  color: ${(props) => {
    switch (props.$status) {
      case "waiting-validation":
        return COLORS.pending;
      case "needs-adjustment":
        return COLORS.completed;
      case "paused":
        return "#6A5ACD";
      default:
        return COLORS.textSecondary;
    }
  }};
`;

export default Dashboard;
