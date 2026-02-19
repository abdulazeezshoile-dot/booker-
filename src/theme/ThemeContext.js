import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { Appearance } from 'react-native';

const ThemeContext = createContext();

const primaryColor = '#2E86AB';
const accentColor = '#F39C12';
const backgroundColor = '#F8FAFC';
const cardColor = '#FFFFFF';
const textPrimary = '#1E293B';
const textSecondary = '#64748B';
const designStyle = 'modern';

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);

  const lightTheme = useMemo(
    function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: backgroundColor,
          card: cardColor,
          textPrimary: textPrimary,
          textSecondary: textSecondary,
          border: '#E5E7EB',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    },
    []
  );

  const darkTheme = useMemo(
    function() {
      return {
        colors: {
          primary: primaryColor,
          accent: accentColor,
          background: '#1F2937',
          card: '#374151',
          textPrimary: '#F9FAFB',
          textSecondary: '#D1D5DB',
          border: '#4B5563',
          success: '#10B981',
          error: '#EF4444',
          warning: '#F59E0B'
        }
      };
    },
    []
  );

  const theme = darkMode ? darkTheme : lightTheme;

  const toggleDarkMode = useCallback(function() {
    setDarkMode(function(prev) {
      return !prev;
    });
  }, []);

  const value = useMemo(
    function() {
      return {
        theme: theme,
        darkMode: darkMode,
        toggleDarkMode: toggleDarkMode,
        designStyle: designStyle,
        // Backward compatibility with old theme names
        toggle: toggleDarkMode,
        colors: theme.colors
      };
    },
    [theme, darkMode, toggleDarkMode]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
