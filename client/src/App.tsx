import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import './App.css';

// Типы
type Habit = {
  id: string;
  name: string;
  frequency: 'daily' | 'weekly';
  category: 'positive' | 'negative';
  isActive: boolean;
  progress: { date: string; count: number }[];
};

type HistoryEntry = {
  id: string;
  habitId: string;
  date: string;
  count: number;
  category: 'positive' | 'negative';
};

// Компонент боковой панели
const Sidebar: React.FC = () => {
  return (
    <div className="sidebar">
      <h2 className="sidebar-title">Habit Tracker</h2>
      <NavLink to="/" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        Главная
      </NavLink>
      <NavLink to="/habits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        Привычки
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        Статистика
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        История
      </NavLink>
    </div>
  );
};

// Главная страница
const Home: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    const storedHistory = localStorage.getItem('history');
    if (storedHabits) setHabits(JSON.parse(storedHabits));
    if (storedHistory) setHistory(JSON.parse(storedHistory));
  }, []);

  const activeHabits = habits.filter((habit) => habit.isActive).slice(0, 4);
  const recentHistory = history.slice(0, 5);
  const positiveProgress = activeHabits
    .filter((h) => h.category === 'positive')
    .reduce((sum, h) => sum + h.progress.reduce((s, p) => s + p.count, 0), 0);
  const negativeProgress = activeHabits
    .filter((h) => h.category === 'negative')
    .reduce((sum, h) => sum + h.progress.reduce((s, p) => s + p.count, 0), 0);
  const motivation = positiveProgress > negativeProgress ? 'Отличная работа! Продолжайте развивать хорошие привычки!' : 'Не сдавайтесь! Попробуйте уменьшить срывы.';

  return (
    <div className="main-content">
      <h1>Главная</h1>
      <p className="motivation">{motivation}</p>
      <div className="overview">
        <div className="overview-section">
          <h2>Текущие привычки</h2>
          {activeHabits.length === 0 ? (
            <p className="empty-text">Нет активных привычек. Добавьте новую!</p>
          ) : (
            <div className="habit-grid">
              {activeHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} setHabits={setHabits} addHistoryEntry={(entry) => setHistory((prev) => [...prev, entry])} />
              ))}
            </div>
          )}
        </div>
        <div className="overview-section">
          <h2>Последняя активность</h2>
          {recentHistory.length === 0 ? (
            <p className="empty-text">Нет записей в истории.</p>
          ) : (
            <div className="history-list">
              {recentHistory.map((entry) => (
                <div key={entry.id} className="history-entry">
                  <p>
                    {entry.date}: {entry.category === 'positive' ? 'Выполнил' : 'Сорвался'}{' '}
                    "{habits.find((h) => h.id === entry.habitId)?.name}" — {entry.count} раз
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Компонент карточки привычки
const HabitCard: React.FC<{
  habit: Habit;
  setHabits: React.Dispatch<React.SetStateAction<Habit[]>>;
  addHistoryEntry: (entry: HistoryEntry) => void;
}> = ({ habit, setHabits, addHistoryEntry }) => {
  const [count, setCount] = useState(0);

  const handleTrack = () => {
    if (count < 0) {
      alert('Количество не может быть отрицательным');
      return;
    }
    if (count === 0) {
      alert('Укажите количество выполнений или срывов');
      return;
    }

    const updatedHabits = [...JSON.parse(localStorage.getItem('habits') || '[]')];
    const habitIndex = updatedHabits.findIndex((h: Habit) => h.id === habit.id);
    const today = new Date().toISOString().split('T')[0];
    updatedHabits[habitIndex].progress.push({ date: today, count });
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    setHabits(updatedHabits);

    const newHistoryEntry: HistoryEntry = {
      id: Date.now().toString(),
      habitId: habit.id,
      date: today,
      count,
      category: habit.category,
    };
    addHistoryEntry(newHistoryEntry);
    localStorage.setItem('history', JSON.stringify([...JSON.parse(localStorage.getItem('history') || '[]'), newHistoryEntry]));

    setCount(0);
  };

  const toggleActive = () => {
    const updatedHabits = [...JSON.parse(localStorage.getItem('habits') || '[]')];
    const habitIndex = updatedHabits.findIndex((h: Habit) => h.id === habit.id);
    updatedHabits[habitIndex].isActive = !updatedHabits[habitIndex].isActive;
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    setHabits(updatedHabits);
  };

  return (
    <div className={`habit-card ${habit.category === 'positive' ? 'positive' : 'negative'}`}>
      <h3>{habit.name}</h3>
      <p>Частота: {habit.frequency === 'daily' ? 'Ежедневно' : 'Еженедельно'}</p>
      <p>Категория: {habit.category === 'positive' ? 'Положительная' : 'Отрицательная'}</p>
      <input
        type="number"
        min="0"
        value={count}
        onChange={(e) => setCount(Number(e.target.value))}
        className="input"
        placeholder="Количество"
      />
      <button className="track-button" onClick={handleTrack}>
        {habit.category === 'positive' ? 'Отметить выполнение' : 'Отметить срыв'}
      </button>
      <button className="toggle-active-button" onClick={toggleActive}>
        {habit.isActive ? 'Сделать неактуальной' : 'Сделать актуальной'}
      </button>
    </div>
  );
};

// Компонент раздела привычек
const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [category, setCategory] = useState<'positive' | 'negative'>('positive');

  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) setHabits(JSON.parse(storedHabits));
  }, []);

  const filteredHabits = habits.filter(
    (habit) => habit.isActive === (tab === 'active') && habit.category === category
  );

  return (
    <div className="main-content">
      <h1>Привычки</h1>
      <div className="tabs">
        <button
          className={`tab ${tab === 'active' ? 'active' : ''}`}
          onClick={() => setTab('active')}
        >
          Актуальные
        </button>
        <button
          className={`tab ${tab === 'inactive' ? 'active' : ''}`}
          onClick={() => setTab('inactive')}
        >
          Неактуальные
        </button>
      </div>
      <div className="category-tabs">
        <button
          className={`tab ${category === 'positive' ? 'active' : ''}`}
          onClick={() => setCategory('positive')}
        >
          Положительные
        </button>
        <button
          className={`tab ${category === 'negative' ? 'active' : ''}`}
          onClick={() => setCategory('negative')}
        >
          Отрицательные
        </button>
      </div>
      <NavLink to="/add-habit" className="add-button">
        Добавить привычку
      </NavLink>
      {filteredHabits.length === 0 ? (
        <p className="empty-text">Нет привычек в этой категории.</p>
      ) : (
        <div className="habit-grid">
          {filteredHabits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              setHabits={setHabits}
              addHistoryEntry={(entry) => {
                const updatedHistory = [...JSON.parse(localStorage.getItem('history') || '[]'), entry];
                localStorage.setItem('history', JSON.stringify(updatedHistory));
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Компонент добавления привычки
const AddHabit: React.FC = () => {
  const [name, setName] = useState('');
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily');
  const [category, setCategory] = useState<'positive' | 'negative'>('positive');

  const handleAddHabit = () => {
    if (!name.trim()) {
      alert('Введите название привычки');
      return;
    }

    const newHabit: Habit = {
      id: Date.now().toString(),
      name,
      frequency,
      category,
      isActive: true,
      progress: [],
    };

    const updatedHabits = [...JSON.parse(localStorage.getItem('habits') || '[]'), newHabit];
    localStorage.setItem('habits', JSON.stringify(updatedHabits));

    setName('');
    setFrequency('daily');
    setCategory('positive');
  };

  return (
    <div className="main-content">
      <h1>Новая привычка</h1>
      <div className="form-container">
        <label>Название привычки</label>
        <input
          type="text"
          placeholder="Введите название"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <label>Частота</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
          className="select"
        >
          <option value="daily">Ежедневно</option>
          <option value="weekly">Еженедельно</option>
        </select>
        <label>Категория</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as 'positive' | 'negative')}
          className="select"
        >
          <option value="positive">Положительная</option>
          <option value="negative">Отрицательная</option>
        </select>
        <button className="add-button" onClick={handleAddHabit}>
          Сохранить
        </button>
      </div>
    </div>
  );
};

// Компонент статистики
const Stats: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month'>('week');

  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) setHabits(JSON.parse(storedHabits));
  }, []);

  const getLastNDays = (days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  const days = timeFilter === 'week' ? getLastNDays(7) : getLastNDays(30);
  const positiveData = days.map((date) => ({
    date,
    count: habits
      .filter((h) => h.category === 'positive' && h.isActive)
      .reduce((sum, h) => sum + (h.progress.find((p) => p.date === date)?.count || 0), 0),
  }));
  const negativeData = days.map((date) => ({
    date,
    count: habits
      .filter((h) => h.category === 'negative' && h.isActive)
      .reduce((sum, h) => sum + (h.progress.find((p) => p.date === date)?.count || 0), 0),
  }));

  return (
    <div className="main-content">
      <h1>Статистика</h1>
      <div className="filter-tabs">
        <button
          className={`tab ${timeFilter === 'week' ? 'active' : ''}`}
          onClick={() => setTimeFilter('week')}
        >
          Неделя
        </button>
        <button
          className={`tab ${timeFilter === 'month' ? 'active' : ''}`}
          onClick={() => setTimeFilter('month')}
        >
          Месяц
        </button>
      </div>
      <div className="stats-container">
        <h2>Положительные привычки</h2>
        {positiveData.every((d) => d.count === 0) ? (
          <p className="empty-text">Нет данных для положительных привычек.</p>
        ) : (
          <LineChart width={600} height={300} data={positiveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#2ecc71" name="Выполнения" />
          </LineChart>
        )}
        <h2>Отрицательные привычки</h2>
        {negativeData.every((d) => d.count === 0) ? (
          <p className="empty-text">Нет данных для отрицательных привычек.</p>
        ) : (
          <LineChart width={600} height={300} data={negativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#e74c3c" name="Срывы" />
          </LineChart>
        )}
      </div>
    </div>
  );
};

// Компонент истории
const History: React.FC = () => {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'positive' | 'negative'>('all');
  const [dateFilter, setDateFilter] = useState('');

  useEffect(() => {
    const storedHistory = localStorage.getItem('history');
    const storedHabits = localStorage.getItem('habits');
    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedHabits) setHabits(JSON.parse(storedHabits));
  }, []);

  const filteredHistory = history.filter((entry) => {
    const matchesCategory = categoryFilter === 'all' || entry.category === categoryFilter;
    const matchesDate = !dateFilter || entry.date === dateFilter;
    return matchesCategory && matchesDate;
  });

  return (
    <div className="main-content">
      <h1>История</h1>
      <div className="filter-container">
        <div>
          <label>Категория:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'positive' | 'negative')}
            className="select"
          >
            <option value="all">Все</option>
            <option value="positive">Положительные</option>
            <option value="negative">Отрицательные</option>
          </select>
        </div>
        <div>
          <label>Дата:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
          />
        </div>
      </div>
      {filteredHistory.length === 0 ? (
        <p className="empty-text">Нет записей в истории.</p>
      ) : (
        <div className="history-list">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className="history-entry">
              <p>
                {entry.date}: {entry.category === 'positive' ? 'Выполнил' : 'Сорвался'}{' '}
                "{habits.find((h) => h.id === entry.habitId)?.name}" — {entry.count} раз
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Главный компонент приложения
const App: React.FC = () => {
  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/habits" element={<Habits />} />
          <Route path="/add-habit" element={<AddHabit />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
