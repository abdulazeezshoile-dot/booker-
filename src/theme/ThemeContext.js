import React, { createContext, useContext, useState } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

const light = {
  mode: 'light',
  background: '#F6F7FB',
  card: '#FFFFFF',
  text: '#0F172A',
  muted: '#6B7280',
  primary: '#0EA5A4',
  danger: '#EF4444',
  shadow: 'rgba(16,24,40,0.06)'
};

const dark = {
  mode: 'dark',
  background: '#0B1220',
  card: '#0F172A',
  text: '#E6EEF6',
  muted: '#9CA3AF',
  primary: '#38BDF8',
  danger: '#FB7185',
  shadow: 'rgba(2,6,23,0.6)'
};

export const ThemeProvider = ({ children }) => {
  const colorScheme = Appearance.getColorScheme();
  const [theme, setTheme] = useState(colorScheme === 'dark' ? dark : light);
  const toggle = () => setTheme((t) => (t.mode === 'dark' ? light : dark));
  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
