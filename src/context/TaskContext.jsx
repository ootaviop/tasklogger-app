import { createContext, useContext, useState, useEffect } from "react";
import localforage from "localforage";
import { format } from "date-fns";
import PropTypes from "prop-types";

// Definição expandida dos status possíveis para tarefas
export const TASK_STATUS = {
  CURRENT: "current",
  COMPLETED: "completed",
  WAITING_VALIDATION: "waiting-validation", // Aguardando validação externa
  NEEDS_ADJUSTMENT: "needs-adjustment", // Requer ajustes após feedback
  PAUSED: "paused", // Pausada temporariamente
};

// Inicialização do contexto
const TaskContext = createContext();

// Hook personalizado para usar o contexto
export const useTaskContext = () => useContext(TaskContext);

// Provedor do contexto
export const TaskProvider = ({ children }) => {
  const [days, setDays] = useState([]);
  const [currentDay, setCurrentDay] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quickInputVisible, setQuickInputVisible] = useState(false);
  const [dashboardVisible, setDashboardVisible] = useState(false);
  const [pendingReminderShown, setPendingReminderShown] = useState(false);

  // Carregar dados do armazenamento local ao iniciar
  useEffect(() => {
    const loadTasks = async () => {
      try {
        const savedDays = await localforage.getItem("tasklogger-days");
        if (savedDays) {
          setDays(savedDays);
        } else {
          // Se não houver dados, criar um dia inicial
          const today = format(new Date(), "yyyy-MM-dd");
          setDays([{ date: today, tasks: [] }]);
        }
        setLoading(false);
      } catch (error) {
        console.error("Erro ao carregar tarefas:", error);
        setError(
          "Falha ao carregar tarefas. Verifique o console para mais detalhes."
        );
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Salvar dados no armazenamento local sempre que houver alterações
  useEffect(() => {
    if (!loading && days.length > 0) {
      try {
        localforage.setItem("tasklogger-days", days).catch((err) => {
          console.error("Erro ao salvar tarefas:", err);
          setError(
            "Falha ao salvar tarefas. Verifique o console para mais detalhes."
          );
        });
      } catch (error) {
        console.error("Erro ao salvar tarefas:", error);
        setError(
          "Falha ao salvar tarefas. Verifique o console para mais detalhes."
        );
      }
    }
  }, [days, loading]);

  // Adicionar uma nova tarefa - implementação imutável
  const addTask = (text, dependencies = null) => {
    if (!text.trim()) return false;

    setDays((prevDays) => {
      // Criar cópias profundas para evitar mutação
      const updatedDays = [...prevDays];
      const updatedTasks = [...updatedDays[currentDay].tasks];

      // Adicionar nova tarefa
      updatedTasks.push({
        id: Date.now().toString(),
        text,
        status: TASK_STATUS.CURRENT,
        timestamp: format(new Date(), "HH:mm"),
        dependencies: dependencies
          ? {
              description: dependencies,
              date: format(new Date(), "yyyy-MM-dd"),
            }
          : null,
        historyLog: [
          {
            status: TASK_STATUS.CURRENT,
            timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
            note: "Tarefa iniciada",
          },
        ],
      });

      // Atualizar o dia atual com a nova lista de tarefas
      updatedDays[currentDay] = {
        ...updatedDays[currentDay],
        tasks: updatedTasks,
      };

      return updatedDays;
    });

    setPendingReminderShown(true);
    return true;
  };

  // Função expandida e imutável para atualizar o status de uma tarefa
  const updateTaskStatus = (taskId, newStatus, additionalInfo = null) => {
    setDays((prevDays) => {
      const updatedDays = [...prevDays];
      const dayTasks = [...updatedDays[currentDay].tasks];

      const taskIndex = dayTasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return prevDays; // Retorna o estado anterior se a tarefa não for encontrada

      const task = { ...dayTasks[taskIndex] };
      const oldStatus = task.status;

      // Atualizar o status
      task.status = newStatus;

      // Registrar no histórico
      if (!task.historyLog) {
        task.historyLog = [];
      }

      task.historyLog = [
        ...task.historyLog,
        {
          status: newStatus,
          timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          note:
            additionalInfo?.note ||
            `Status alterado de ${oldStatus} para ${newStatus}`,
        },
      ];

      // Adicionar informações de dependência, se fornecidas
      if (additionalInfo?.dependency) {
        task.dependencies = {
          description: additionalInfo.dependency,
          date: format(new Date(), "yyyy-MM-dd"),
        };
      }

      // Se estiver marcando como WAITING_VALIDATION, registrar de quem está esperando
      if (
        newStatus === TASK_STATUS.WAITING_VALIDATION &&
        additionalInfo?.waitingFor
      ) {
        task.waitingFor = additionalInfo.waitingFor;
      }

      // Se estiver marcando como NEEDS_ADJUSTMENT, registrar o feedback
      if (
        newStatus === TASK_STATUS.NEEDS_ADJUSTMENT &&
        additionalInfo?.feedback
      ) {
        task.feedback = additionalInfo.feedback;
      }

      // Atualizar a tarefa na lista
      dayTasks[taskIndex] = task;

      // Se a tarefa estiver marcada como atual e houver outra tarefa atual,
      // atualizar a outra para completada
      if (newStatus === TASK_STATUS.CURRENT) {
        dayTasks.forEach((otherTask, idx) => {
          if (idx !== taskIndex && otherTask.status === TASK_STATUS.CURRENT) {
            const updatedTask = { ...otherTask };
            updatedTask.status = TASK_STATUS.COMPLETED;

            if (!updatedTask.historyLog) {
              updatedTask.historyLog = [];
            }

            updatedTask.historyLog = [
              ...updatedTask.historyLog,
              {
                status: TASK_STATUS.COMPLETED,
                timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
                note: "Automaticamente marcada como concluída ao iniciar nova tarefa",
              },
            ];

            dayTasks[idx] = updatedTask;
          }
        });
      }

      // Atualizar o dia com as tarefas modificadas
      updatedDays[currentDay] = {
        ...updatedDays[currentDay],
        tasks: dayTasks,
      };

      return updatedDays;
    });

    return true;
  };

  // Função imutável para criar uma nova tarefa relacionada (ajuste, continuação)
  const createRelatedTask = (originalTaskId, newText, relationType) => {
    const dayTasks = days[currentDay].tasks;
    const originalTask = dayTasks.find((task) => task.id === originalTaskId);

    if (!originalTask) return null;

    // Criar nova tarefa baseada na original
    const newTaskId = Date.now().toString();
    const newTask = {
      id: newTaskId,
      text: newText,
      status: TASK_STATUS.CURRENT,
      timestamp: format(new Date(), "HH:mm"),
      relatedTo: {
        taskId: originalTaskId,
        type: relationType, // 'adjustment', 'continuation', etc.
      },
      historyLog: [
        {
          status: TASK_STATUS.CURRENT,
          timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
          note: `Tarefa criada como ${relationType} da tarefa "${originalTask.text}"`,
        },
      ],
    };

    // Atualizar o estado original e adicionar a nova tarefa
    setDays((prevDays) => {
      const updatedDays = [...prevDays];
      const updatedTasks = [...updatedDays[currentDay].tasks];

      // Atualizar tarefa original se necessário
      if (relationType === "adjustment") {
        const originalIndex = updatedTasks.findIndex(
          (task) => task.id === originalTaskId
        );
        if (originalIndex !== -1) {
          const updatedOriginal = { ...updatedTasks[originalIndex] };
          updatedOriginal.status = TASK_STATUS.NEEDS_ADJUSTMENT;

          if (!updatedOriginal.historyLog) {
            updatedOriginal.historyLog = [];
          }

          updatedOriginal.historyLog = [
            ...updatedOriginal.historyLog,
            {
              status: TASK_STATUS.NEEDS_ADJUSTMENT,
              timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
              note: "Necessita de ajustes, nova tarefa criada",
            },
          ];

          updatedTasks[originalIndex] = updatedOriginal;
        }
      }

      // Marcar qualquer tarefa atual como completada
      updatedTasks.forEach((task, index) => {
        if (task.status === TASK_STATUS.CURRENT) {
          const updatedTask = { ...task };
          updatedTask.status = TASK_STATUS.COMPLETED;

          if (!updatedTask.historyLog) {
            updatedTask.historyLog = [];
          }

          updatedTask.historyLog = [
            ...updatedTask.historyLog,
            {
              status: TASK_STATUS.COMPLETED,
              timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss"),
              note: "Automaticamente marcada como concluída ao iniciar nova tarefa",
            },
          ];

          updatedTasks[index] = updatedTask;
        }
      });

      // Adicionar a nova tarefa
      updatedTasks.push(newTask);

      // Atualizar o dia
      updatedDays[currentDay] = {
        ...updatedDays[currentDay],
        tasks: updatedTasks,
      };

      return updatedDays;
    });

    return newTaskId;
  };

  // Função para obter todas as tarefas pendentes (aguardando validação ou ajustes)
  const getPendingTasks = () => {
    const allPendingTasks = [];

    days.forEach((day, dayIndex) => {
      const pendingInDay = day.tasks.filter(
        (task) =>
          task.status === TASK_STATUS.WAITING_VALIDATION ||
          task.status === TASK_STATUS.NEEDS_ADJUSTMENT ||
          task.status === TASK_STATUS.PAUSED
      );

      if (pendingInDay.length > 0) {
        allPendingTasks.push({
          date: day.date,
          dayIndex,
          tasks: pendingInDay,
        });
      }
    });

    return allPendingTasks;
  };

  // Verificar se há tarefas pendentes de validação
  const hasPendingValidations = () => {
    return days.some((day) =>
      day.tasks.some((task) => task.status === TASK_STATUS.WAITING_VALIDATION)
    );
  };

  // Obter as tarefas do dia atual
  const getCurrentDayTasks = () => {
    if (days.length === 0 || !days[currentDay]) return [];
    return days[currentDay].tasks;
  };

  // Obter a data do dia atual
  const getCurrentDayDate = () => {
    if (days.length === 0 || !days[currentDay])
      return format(new Date(), "yyyy-MM-dd");
    return days[currentDay].date;
  };

  // Alternar visibilidade da interface de entrada rápida
  const toggleQuickInput = () => {
    setQuickInputVisible(!quickInputVisible);
  };

  // Alternar visibilidade do painel de controle
  const toggleDashboard = () => {
    setDashboardVisible(!dashboardVisible);
  };

  // Adicionar um novo dia - versão melhorada
  const addNewDay = (date = format(new Date(), "yyyy-MM-dd")) => {
    // Verificar se o dia já existe
    const dayExists = days.some((day) => day.date === date);
    if (dayExists) return false;

    setDays((prevDays) => [...prevDays, { date, tasks: [] }]);

    return true;
  };

  // Obter estatísticas de um período
  const getStats = (startDate, endDate) => {
    try {
      // Filtrar dias dentro do intervalo
      const filteredDays = days.filter((day) => {
        return day.date >= startDate && day.date <= endDate;
      });

      // Estatísticas básicas
      const totalTasks = filteredDays.reduce(
        (sum, day) => sum + day.tasks.length,
        0
      );
      const completedTasks = filteredDays.reduce(
        (sum, day) =>
          sum +
          day.tasks.filter((task) => task.status === TASK_STATUS.COMPLETED)
            .length,
        0
      );
      const pendingTasks = filteredDays.reduce(
        (sum, day) =>
          sum +
          day.tasks.filter(
            (task) =>
              task.status === TASK_STATUS.WAITING_VALIDATION ||
              task.status === TASK_STATUS.NEEDS_ADJUSTMENT
          ).length,
        0
      );

      return {
        totalTasks,
        completedTasks,
        pendingTasks,
        completionRate:
          totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      };
    } catch (error) {
      console.error("Erro ao calcular estatísticas:", error);
      return {
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        completionRate: 0,
      };
    }
  };

  // Resetar a flag que controla se já mostramos o lembrete de pendências
  const resetPendingReminderShown = () => {
    setPendingReminderShown(false);
  };

  // Limpar mensagens de erro
  const clearError = () => {
    setError(null);
  };

  const deleteTask = (taskId) => {
    setDays((prevDays) => {
      const updatedDays = [...prevDays];
      const dayTasks = [...updatedDays[currentDay].tasks];

      const taskIndex = dayTasks.findIndex((task) => task.id === taskId);
      if (taskIndex === -1) return prevDays; // Retorna o estado anterior se a tarefa não for encontrada

      // Remover a tarefa
      const updatedTasks = dayTasks.filter((task) => task.id !== taskId);

      // Atualizar o dia com as tarefas modificadas
      updatedDays[currentDay] = {
        ...updatedDays[currentDay],
        tasks: updatedTasks,
      };

      return updatedDays;
    });

    return true;
  };

  return (
    <TaskContext.Provider
      value={{
        days,
        currentDay,
        setCurrentDay,
        addTask,
        updateTaskStatus,
        createRelatedTask,
        getCurrentDayTasks,
        getCurrentDayDate,
        getPendingTasks,
        hasPendingValidations,
        getStats,
        addNewDay,
        quickInputVisible,
        toggleQuickInput,
        dashboardVisible,
        toggleDashboard,
        pendingReminderShown,
        resetPendingReminderShown,
        loading,
        error,
        clearError,
        deleteTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};

// Adicione a validação de props
TaskProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
