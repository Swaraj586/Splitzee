import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setThemeMode: (mode: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('splitzee_theme');
      if (saved === 'dark') return 'dark';
      if (saved === 'light') return 'light';
    } catch {
      // Ignore
    }
    return 'light'; // Default to light mode
  });

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (theme === 'dark') {
      root.classList.add('dark');
      body.classList.add('dark');
      root.style.backgroundColor = '#020617';
      root.style.color = '#f8fafc';
      body.style.backgroundColor = '#020617';
      body.style.color = '#f8fafc';
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      root.style.backgroundColor = '#f8fafc';
      root.style.color = '#0f172a';
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
    }

    try {
      localStorage.setItem('splitzee_theme', theme);
    } catch {
      // Ignore
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setThemeMode = (mode: Theme) => {
    setTheme(mode);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
