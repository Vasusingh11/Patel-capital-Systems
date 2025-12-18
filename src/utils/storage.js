// Storage utilities for Patel Capital System
import { getTrophyPointData } from './trophyPointData';
import { getPatelCapitalPartnersData } from './patelCapitalPartnersData';

const DB_NAME = 'PatelCapitalDB';

export const loadFromStorage = () => {
  try {
    const data = localStorage.getItem(DB_NAME);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed.companies || [];
    }
  } catch (error) {
    console.error('Error loading from storage:', error);
  }
  return null;
};

export const saveToStorage = (companies) => {
  try {
    const data = {
      companies,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem(DB_NAME, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to storage:', error);
    return false;
  }
};

export const exportData = (companies) => {
  const data = {
    companies,
    exportDate: new Date().toISOString(),
    version: '2.0'
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `patel_capital_database_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.companies && Array.isArray(data.companies)) {
          resolve(data.companies);
        } else {
          reject(new Error('Invalid database format'));
        }
      } catch (error) {
        reject(new Error('Error parsing database file'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};

export const getDefaultData = () => {
  return [
    // Complete Patel Capital Partners data with all 10 investors
    getPatelCapitalPartnersData(),
    {
      id: 'birchtree-capital',
      name: 'BIRCHTREE CAPITAL',
      defaultRate: 8.50,
      investors: [
        {
          id: '2022-01-15',
          name: 'Sarah Johnson',
          address: '123 Maple Street, Portland, OR 97201',
          email: 'sarah.johnson@email.com',
          phone: '(503) 555-0123',
          initialInvestment: 150000,
          interestRate: 8.5,
          startDate: '2022-01-15',
          reinvesting: true,
          transactions: [
            { 
              date: '2022-01-15', 
              type: 'initial', 
              amount: 150000, 
              description: 'Initial balance' 
            },
            { 
              date: '2022-03-31', 
              type: 'interest-earned', 
              amount: 3187.50, 
              description: 'Q1 2022 Interest Earned/Reinvested' 
            },
            { 
              date: '2022-06-30', 
              type: 'interest-earned', 
              amount: 3255.47, 
              description: 'Q2 2022 Interest Earned/Reinvested' 
            },
            { 
              date: '2022-09-30', 
              type: 'interest-earned', 
              amount: 3324.67, 
              description: 'Q3 2022 Interest Earned/Reinvested' 
            }
          ]
        }
      ]
    },
    // Trophy Point company with PC1, PC2, PC3 investors
    getTrophyPointData()
  ];
};
