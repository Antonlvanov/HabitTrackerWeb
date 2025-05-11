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
        Avaleht
      </NavLink>
      <NavLink to="/habits" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        Harjumused
      </NavLink>
      <NavLink to="/stats" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        Statistika
      </NavLink>
      <NavLink to="/history" className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
        Ajalugu
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
  const motivation = positiveProgress > negativeProgress ? 'Suurepärane töö! Jätka positiivsete harjumuste arendamist!' : 'Ära anna alla! Proovi vähendada tagasilööke.';

  // Данные для сборной статистики за неделю
  const getLastNDays = (days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };
  const days = getLastNDays(7);
  const statsData = days.map((date) => ({
    date,
    positive: habits
      .filter((h) => h.category === 'positive' && h.isActive)
      .reduce((sum, h) => sum + (h.progress.find((p) => p.date === date)?.count || 0), 0),
    negative: habits
      .filter((h) => h.category === 'negative' && h.isActive)
      .reduce((sum, h) => sum + (h.progress.find((p) => p.date === date)?.count || 0), 0),
  }));

  return (
    <div className="main-content">
      <h1>Avaleht</h1>
      <p className="motivation">{motivation}</p>
      <div className="overview">
        <div className="overview-section">
          <h2>Aktiivsed Harjumused</h2>
          {activeHabits.length === 0 ? (
            <p className="empty-text">Aktiivseid harjumusi pole. Lisa uus!</p>
          ) : (
            <div className="habit-grid">
              {activeHabits.map((habit) => (
                <HabitCard key={habit.id} habit={habit} setHabits={setHabits} addHistoryEntry={(entry) => setHistory((prev) => [...prev, entry])} />
              ))}
            </div>
          )}
        </div>
        <div className="overview-section">
          <h2>Viimased Tegevused</h2>
          {recentHistory.length === 0 ? (
            <p className="empty-text">Ajaloo kirjeid pole.</p>
          ) : (
            <div className="history-list">
              {recentHistory.map((entry) => (
                <div key={entry.id} className={`history-entry ${entry.category === 'positive' ? 'positive' : 'negative'}`}>
                  <p>
                    {entry.date}: {entry.category === 'positive' ? 'Täidetud' : 'Ebaõnnestumine'}{' '}
                    "{habits.find((h) => h.id === entry.habitId)?.name}" — {entry.count} korda
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="overview-section">
          <h2>Nädala Statistika</h2>
          {statsData.every((d) => d.positive === 0 && d.negative === 0) ? (
            <p className="empty-text">Andmed puuduvad.</p>
          ) : (
            <LineChart width={400} height={200} data={statsData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="positive" stroke="#2ecc71" name="Täitmine" />
              <Line type="monotone" dataKey="negative" stroke="#e74c3c" name="Ebaõnnestumised" />
            </LineChart>
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
  const handleTrack = () => {
    const updatedHabits = [...JSON.parse(localStorage.getItem('habits') || '[]')];
    const habitIndex = updatedHabits.findIndex((h: Habit) => h.id === habit.id);
    const today = new Date().toISOString().split('T')[0];
    updatedHabits[habitIndex].progress.push({ date: today, count: 1 });
    localStorage.setItem('habits', JSON.stringify(updatedHabits));
    setHabits(updatedHabits);

    const newHistoryEntry: HistoryEntry = {
      id: Date.now().toString(),
      habitId: habit.id,
      date: today,
      count: 1,
      category: habit.category,
    };
    addHistoryEntry(newHistoryEntry);
    localStorage.setItem('history', JSON.stringify([...JSON.parse(localStorage.getItem('history') || '[]'), newHistoryEntry]));
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
      <h3>
        {habit.category === 'positive' ? '✅ ' : '❌ '}
        {habit.name}
      </h3>
      <p>Sagedus: {habit.frequency === 'daily' ? 'Igapäevane' : 'Iganädalane'}</p>
      <p>Kategooria: {habit.category === 'positive' ? 'Positiivne' : 'Negatiivne'}</p>
      <button className="track-button" onClick={handleTrack}>
        {habit.category === 'positive' ? 'Märgi Täitmine' : 'Märgi Ebaõnnestumine'}
      </button>
      <button className="toggle-active-button" onClick={toggleActive}>
        {habit.isActive ? 'Muuda Mitteaktiivseks' : 'Muuda Aktiivseks'}
      </button>
    </div>
  );
};

// Компонент раздела привычек
const Habits: React.FC = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [tab, setTab] = useState<'active' | 'inactive'>('active');
  const [category, setCategory] = useState<'all' | 'positive' | 'negative'>('all');

  useEffect(() => {
    const storedHabits = localStorage.getItem('habits');
    if (storedHabits) setHabits(JSON.parse(storedHabits));
  }, []);

  const filteredHabits = habits.filter((habit) =>
    habit.isActive === (tab === 'active') && (category === 'all' || habit.category === category)
  );

  return (
    <div className="main-content">
      <h1>Harjumused</h1>
      <div className="tabs">
        <button
          className={`tab ${tab === 'active' ? 'active' : ''}`}
          onClick={() => setTab('active')}
        >
          Aktiivsed
        </button>
        <button
          className={`tab ${tab === 'inactive' ? 'active' : ''}`}
          onClick={() => setTab('inactive')}
        >
          Mitteaktiivsed
        </button>
      </div>
      <div className="category-tabs">
        <button
          className={`tab ${category === 'all' ? 'active' : ''}`}
          onClick={() => setCategory('all')}
        >
          Kõik
        </button>
        <button
          className={`tab ${category === 'positive' ? 'active' : ''}`}
          onClick={() => setCategory('positive')}
        >
          Positiivsed
        </button>
        <button
          className={`tab ${category === 'negative' ? 'active' : ''}`}
          onClick={() => setCategory('negative')}
        >
          Negatiivsed
        </button>
      </div>
      <NavLink to="/add-habit" className="add-button">
        Lisa Harjumus
      </NavLink>
      {filteredHabits.length === 0 ? (
        <p className="empty-text">Selles kategoorias harjumusi pole.</p>
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
      alert('Sisesta harjumuse nimi');
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
      <h1>Uus Harjumus</h1>
      <div className="form-container">
        <label>Harjumuse Nimi</label>
        <input
          type="text"
          placeholder="Sisesta nimi"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
        />
        <label>Sagedus</label>
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as 'daily' | 'weekly')}
          className="select"
        >
          <option value="daily">Igapäevane</option>
          <option value="weekly">Iganädalane</option>
        </select>
        <label>Kategooria</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value as 'positive' | 'negative')}
          className="select"
        >
          <option value="positive">Positiivne</option>
          <option value="negative">Negatiivne</option>
        </select>
        <button className="add-button" onClick={handleAddHabit}>
          Salvesta
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
      <h1>Statistika</h1>
      <div className="filter-tabs">
        <button
          className={`tab ${timeFilter === 'week' ? 'active' : ''}`}
          onClick={() => setTimeFilter('week')}
        >
          Nädal
        </button>
        <button
          className={`tab ${timeFilter === 'month' ? 'active' : ''}`}
          onClick={() => setTimeFilter('month')}
        >
          Kuu
        </button>
      </div>
      <div className="stats-container">
        <h2>Positiivsed Harjumused</h2>
        {positiveData.every((d) => d.count === 0) ? (
          <p className="empty-text">Positiivsete harjumuste andmed puuduvad.</p>
        ) : (
          <LineChart width={600} height={300} data={positiveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#2ecc71" name="Täitmine" />
          </LineChart>
        )}
        <h2>Negatiivsed Harjumused</h2>
        {negativeData.every((d) => d.count === 0) ? (
          <p className="empty-text">Negatiivsete harjumuste andmed puuduvad.</p>
        ) : (
          <LineChart width={600} height={300} data={negativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="count" stroke="#e74c3c" name="Ebaõnnestumised" />
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
      <h1>Ajalugu</h1>
      <div className="filter-container">
        <div>
          <label>Kategooria:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as 'all' | 'positive' | 'negative')}
            className="select"
          >
            <option value="all">Kõik</option>
            <option value="positive">Positiivsed</option>
            <option value="negative">Negatiivsed</option>
          </select>
        </div>
        <div>
          <label>Kuupäev:</label>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="input"
          />
        </div>
      </div>
      {filteredHistory.length === 0 ? (
        <p className="empty-text">Ajaloo kirjeid pole.</p>
      ) : (
        <div className="history-list">
          {filteredHistory.map((entry) => (
            <div key={entry.id} className={`history-entry ${entry.category === 'positive' ? 'positive' : 'negative'}`}>
              <p>
                {entry.date}: {entry.category === 'positive' ? 'Täidetud' : 'Ebaõnnestumine'}{' '}
                "{habits.find((h) => h.id === entry.habitId)?.name}" — {entry.count} korda
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
