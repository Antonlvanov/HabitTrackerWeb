import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './App.css';

// Регистрация компонентов Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Типы для привычек
type Habit = {
  id: string;
  name: string;
  description: string;
  category: string;
  frequency: string;
  reminder?: string;
  completedDates: string[];
};

const Stats: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);

  // Загрузка привычек из localStorage
  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) {
      setHabits(JSON.parse(storedHabits));
    }
  }, []);

  // Подготовка данных для графика
  const getChartData = () => {
    const labels: string[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      labels.push(date.toISOString().split('T')[0]);
    }

    const datasets = habits.map((habit) => ({
      label: habit.name,
      data: labels.map((date) =>
        habit.completedDates.includes(date) ? 1 : 0
      ),
      borderColor: getRandomColor(),
      fill: false,
    }));

    return {
      labels,
      datasets,
    };
  };

  // Генерация случайного цвета для линий графика
  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // Расчёт процента выполнения за последние 30 дней
  const getCompletionRate = (habit: Habit) => {
    const totalDays = 30;
    const completedDays = habit.completedDates.filter((date) => {
      const habitDate = new Date(date);
      const today = new Date();
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      return habitDate >= monthAgo && habitDate <= today;
    }).length;
    return ((completedDays / totalDays) * 100).toFixed(2);
  };

  // Получение истории выполнения
  const getHistory = (habit: Habit) => {
    return habit.completedDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  return (
    <div className="container">
      <h1>Статистика выполнения</h1>
      {habits.length === 0 ? (
        <p className="empty-text">Нет данных для статистики.</p>
      ) : (
        <>
          <div className="chart-container">
            <Line
              data={getChartData()}
              options={{
                responsive: true,
                plugins: {
                  title: {
                    display: true,
                    text: 'Выполнение привычек за последние 7 дней',
                  },
                  legend: {
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 1,
                    ticks: {
                      stepSize: 1,
                      callback: (value) => (value === 1 ? 'Выполнено' : 'Не выполнено'),
                    },
                  },
                },
              }}
            />
          </div>
          <div className="stats-list">
            {habits.map((habit) => (
              <div key={habit.id} className="stat-card">
                <h3>{habit.name}</h3>
                <p>Процент выполнения (30 дней): {getCompletionRate(habit)}%</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${getCompletionRate(habit)}%` }}
                  ></div>
                </div>
                <p>История выполнения:</p>
                <ul className="history-list">
                  {getHistory(habit).length === 0 ? (
                    <li>Нет записей</li>
                  ) : (
                    getHistory(habit).map((date) => (
                      <li key={date}>{new Date(date).toLocaleDateString()}</li>
                    ))
                  )}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Stats;
