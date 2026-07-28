import React, { createContext, useState, useContext, useEffect } from 'react';
import { employees, initialCustomers, campaigns as initialCampaigns, deals as initialDeals } from '../data/mockData';

const CRMContext = createContext();

export const useCRM = () => useContext(CRMContext);

export const CRMProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [currentUser, setCurrentUser] = useState(employees[0]);
  
  const [customers, setCustomers] = useState(initialCustomers);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [deals, setDeals] = useState(initialDeals);

  // Toggle Theme
  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Actions
  const updateCustomerStatus = (customerId, newStatus) => {
    setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStatus } : c));
  };

  const addDeal = (deal) => {
    setDeals(prev => [...prev, deal]);
  };

  const addCustomer = (customer) => {
    setCustomers(prev => [...prev, customer]);
  };

  return (
    <CRMContext.Provider value={{
      theme, toggleTheme,
      currentUser, setCurrentUser,
      employees,
      customers, setCustomers, updateCustomerStatus, addCustomer,
      campaigns, setCampaigns,
      deals, addDeal
    }}>
      {children}
    </CRMContext.Provider>
  );
};
