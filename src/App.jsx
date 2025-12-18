import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Plus, 
  FileText, 
  TrendingUp, 
  DollarSign, 
  Edit, 
  X, 
  PlusCircle,
  LogOut,
  Users,
  Building2,
  ArrowDownCircle,
  MoreVertical,
  Eye,
  Mail,
  FileSpreadsheet,
  RefreshCw,
  Trash2
} from 'lucide-react';

import { 
  calculateCurrentBalance, 
  calculateTotalInterest, 
  calculateYearlyInterest,
  getQuarterDates
} from './utils/calculations';

import { 
  loadFromStorage, 
  saveToStorage, 
  getDefaultData 
} from './utils/storage';

import { 
  downloadStatement
} from './utils/statementGenerator';

import {
  exportToExcel,
  exportAllToExcel
} from './utils/excelExport';

import { 
  login, 
  logout, 
  getCurrentUser, 
  initializeAuth
} from './utils/auth';

import Login from './components/Login';
import UserManagement from './components/UserManagement';

const PatelCapitalSystem = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [activeSection, setActiveSection] = useState('companies');
  const [showModal, setShowModal] = useState(null);
  const [modalData, setModalData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
    const user = getCurrentUser();
    if (user) {
      setIsLoggedIn(true);
      setCurrentUser(user);
    }
    
    // Force clear old data on first load to ensure new data loads
    const dataVersion = localStorage.getItem('PatelCapitalDataVersion');
    if (dataVersion !== '2.1') {
      localStorage.removeItem('PatelCapitalDB');
      localStorage.setItem('PatelCapitalDataVersion', '2.1');
    }
  }, []);

  // Handle login
  const handleLogin = (email, password) => {
    const result = login(email, password);
    if (result.success) {
      setIsLoggedIn(true);
      setCurrentUser(result.user);
    }
    return result;
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setSelectedCompany(null);
    setSelectedInvestor(null);
    setActiveSection('companies');
  };

  // Handle refresh - reload data from source
  const handleRefresh = () => {
    // Clear localStorage to force reload from source
    localStorage.removeItem('PatelCapitalDB');
    // Reload data
    const defaultData = getDefaultData();
    setCompanies(defaultData);
    saveToStorage(defaultData);
    // Reset selections
    setSelectedCompany(null);
    setSelectedInvestor(null);
    setActiveSection('companies');
  };

  // Initialize with data from localStorage or default data
  useEffect(() => {
    if (isLoggedIn) {
      const stored = loadFromStorage();
      if (stored) {
        setCompanies(stored);
      } else {
        const defaultData = getDefaultData();
        setCompanies(defaultData);
        saveToStorage(defaultData);
      }
    }
  }, [isLoggedIn]);

  // Save to localStorage whenever companies change
  useEffect(() => {
    if (isLoggedIn && companies.length > 0) {
      saveToStorage(companies);
    }
  }, [isLoggedIn, companies]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.relative')) {
        setOpenDropdownId(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  // Show login screen if not authenticated
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // Date utility functions for new format: DD-MMM-YYYY (e.g., '23-Apr-2021')
  const parseDate = (dateStr) => {
    // Handle DD-MMM-YYYY format
    if (typeof dateStr === 'string' && dateStr.match(/^\d{2}-[A-Za-z]{3}-\d{4}$/)) {
      const months = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
      const [day, month, year] = dateStr.split('-');
      return new Date(parseInt(year), months[month], parseInt(day));
    }
    // Fallback to standard parsing
    return new Date(dateStr);
  };

  const formatDateForInput = (dateStr) => {
    // Convert DD-MMM-YYYY to YYYY-MM-DD for date inputs
    const date = parseDate(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateForStorage = (dateStr) => {
    // Convert YYYY-MM-DD (from input) to DD-MMM-YYYY for storage
    if (typeof dateStr === 'string' && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const date = new Date(dateStr);
      const day = String(date.getDate()).padStart(2, '0');
      const month = monthNames[date.getMonth()];
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    }
    return dateStr;
  };

  const getTodayFormatted = () => {
    const today = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(today.getDate()).padStart(2, '0');
    const month = monthNames[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date for display in UI (e.g., "21 Oct 2025")
  const formatDateForDisplay = (dateStr) => {
    const date = parseDate(dateStr);
    const day = date.getDate();
    const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    return `${day} ${monthShort} ${year}`;
  };

  // Calculate weighted interest rate for upcoming quarters (if rate changes mid-quarter)
  const calculateNextQuarterWeightedRate = (investor) => {
    const today = new Date();
    const currentQuarter = Math.floor(today.getMonth() / 3);
    
    // Check next 4 quarters for any rate changes
    for (let i = 1; i <= 4; i++) {
      const quarterStart = new Date(today.getFullYear(), (currentQuarter + i) * 3, 1);
      const quarterEnd = new Date(today.getFullYear(), (currentQuarter + i + 1) * 3, 0);
      
      // Find rate changes in this quarter
      const rateChangesInQuarter = investor.transactions.filter(t => {
        if (t.type !== 'rate-change') return false;
        const txDate = parseDate(t.date);
        return txDate >= quarterStart && txDate <= quarterEnd;
      });
      
      if (rateChangesInQuarter.length > 0) {
        // Found a rate change - calculate weighted rate
        const rateChange = rateChangesInQuarter[0];
        const rateChangeDate = parseDate(rateChange.date);
        
        // Calculate days before and after rate change
        const totalDays = Math.round((quarterEnd - quarterStart) / (1000 * 60 * 60 * 24)) + 1;
        const daysBeforeChange = Math.round((rateChangeDate - quarterStart) / (1000 * 60 * 60 * 24));
        const daysAfterChange = totalDays - daysBeforeChange;
        
        const oldRate = rateChange.metadata?.oldRate || investor.interestRate;
        const newRate = rateChange.metadata?.newRate || investor.interestRate;
        
        // Calculate weighted rate
        const weightedRate = ((oldRate * daysBeforeChange) + (newRate * daysAfterChange)) / totalDays;
        
        // Get quarter name
        const quarterNames = ['Q1', 'Q2', 'Q3', 'Q4'];
        const quarterIndex = Math.floor(quarterStart.getMonth() / 3);
        const quarterName = `${quarterNames[quarterIndex]} ${quarterStart.getFullYear()}`;
        
        return {
          weightedRate: weightedRate.toFixed(2),
          oldRate: oldRate,
          newRate: newRate,
          daysBeforeChange: daysBeforeChange,
          daysAfterChange: daysAfterChange,
          totalDays: totalDays,
          quarterStart: formatDateForDisplay(formatDateForStorage(quarterStart.toISOString().split('T')[0])),
          quarterEnd: formatDateForDisplay(formatDateForStorage(quarterEnd.toISOString().split('T')[0])),
          changeDate: formatDateForDisplay(formatDateForStorage(rateChangeDate.toISOString().split('T')[0])),
          quarterName: quarterName
        };
      }
    }
    
    return null; // No rate change found in next 4 quarters
  };

  const addCompany = (data) => {
    const newCompany = {
      id: data.name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
      name: data.name,
      defaultRate: parseFloat(data.defaultRate),
      investors: []
    };
    setCompanies([...companies, newCompany]);
    setShowModal(null);
    alert('Company added successfully!');
  };

  const addInvestor = (data) => {
    const updatedCompanies = companies.map(company => {
      if (company.id === selectedCompany.id) {
        const newInvestor = {
          ...data,
          id: getTodayFormatted() + '-' + Date.now(),
          initialInvestment: parseFloat(data.initialInvestment),
          interestRate: parseFloat(data.interestRate),
          transactions: [{
            date: data.startDate,
            type: 'initial',
            amount: parseFloat(data.initialInvestment),
            description: 'Initial balance'
          }]
        };
        return { ...company, investors: [...company.investors, newInvestor] };
      }
      return company;
    });
    setCompanies(updatedCompanies);
    setShowModal(null);
  };

  const updateInvestor = (investorId, updates) => {
    const updatedCompanies = companies.map(company => {
      if (company.id === selectedCompany.id) {
        return {
          ...company,
          investors: company.investors.map(inv => {
            if (inv.id === investorId) {
              const oldRate = inv.interestRate;
              const newRate = updates.interestRate ? parseFloat(updates.interestRate) : oldRate;
              
              const updated = { 
                ...inv, 
                ...updates,
                initialInvestment: updates.initialInvestment ? parseFloat(updates.initialInvestment) : inv.initialInvestment,
                interestRate: newRate,
                // Preserve special fields if they exist
                ...(inv.ein && { ein: inv.ein }),
                ...(inv.accountType && { accountType: inv.accountType }),
                ...(inv.accountName && { accountName: inv.accountName }),
                transactions: inv.transactions // Preserve existing transactions
              };
              
              if (updated.transactions[0]?.type === 'initial') {
                if (updates.initialInvestment) {
                  updated.transactions[0].amount = parseFloat(updates.initialInvestment);
                }
                if (updates.startDate) {
                  updated.transactions[0].date = updates.startDate;
                }
              }
              
              // If interest rate changed, add rate-change transaction and recalculate future interest
              if (oldRate !== newRate) {
                console.log(`Rate change detected: ${oldRate}% → ${newRate}% for investor ${inv.name}`);
                const today = getTodayFormatted();
                
                // Check if a rate-change transaction already exists for today
                const rateChangeExists = updated.transactions.some(
                  t => t.type === 'rate-change' && t.date === today
                );
                
                if (!rateChangeExists) {
                  console.log('Adding rate change transaction and recalculating future interest...');
                  // Add rate-change transaction
                  updated.transactions.push({
                    date: today,
                    type: 'rate-change',
                    amount: 0,
                    description: `RATE CHANGE: ${oldRate}% → ${newRate}% effective ${today}`,
                    metadata: {
                      oldRate: oldRate,
                      newRate: newRate
                    }
                  });
                  
                  // Sort transactions by date
                  updated.transactions.sort((a, b) => parseDate(a.date) - parseDate(b.date));
                  
                  // Recalculate future interest-earned transactions
                  const todayDate = parseDate(today);
                  let futureTransactionsUpdated = 0;
                  
                  updated.transactions = updated.transactions.map(t => {
                    const txDate = parseDate(t.date);
                    // Only update future interest-earned transactions
                    if (t.type === 'interest-earned' && txDate > todayDate) {
                      // Calculate balance at the time of this transaction
                      const priorTransactions = updated.transactions.filter(
                        pt => parseDate(pt.date) < txDate
                      );
                      
                      let balance = 0;
                      priorTransactions.forEach(pt => {
                        if (pt.type === 'initial' || pt.type === 'investment') {
                          balance += pt.amount;
                        } else if (pt.type === 'withdrawal') {
                          balance -= pt.amount;
                        } else if (pt.type === 'interest-earned') {
                          balance += pt.amount;
                        } else if (pt.type === 'interest-paid') {
                          balance -= pt.amount;
                        } else if (pt.type === 'adjustment' || pt.type === 'bonus') {
                          balance += pt.amount;
                        }
                      });
                      
                      // Calculate quarterly interest based on new rate
                      // Assuming quarterly interest = (balance * rate) / 4
                      const quarterlyInterest = (balance * (newRate / 100)) / 4;
                      
                      futureTransactionsUpdated++;
                      
                      return {
                        ...t,
                        amount: parseFloat(quarterlyInterest.toFixed(2)),
                        description: t.description.replace(
                          /@\s*\d+(\.\d+)?%/,
                          `@ ${newRate}%`
                        )
                      };
                    }
                    return t;
                  });
                  
                  // Show success message
                  console.log(`Rate change complete. ${futureTransactionsUpdated} future transactions updated.`);
                  setTimeout(() => {
                    alert(`✅ Interest rate updated successfully!\n\n` +
                          `• Changed from ${oldRate}% to ${newRate}%\n` +
                          `• Effective date: ${today}\n` +
                          `• Rate change transaction added\n` +
                          `• ${futureTransactionsUpdated} future interest transaction(s) recalculated`);
                  }, 100);
                } else {
                  console.log('Rate change transaction already exists for today, skipping.');
                }
              } else {
                console.log('No rate change detected.');
              }
              
              return updated;
            }
            return inv;
          })
        };
      }
      return company;
    });
    setCompanies(updatedCompanies);
    if (selectedInvestor?.id === investorId) {
      setSelectedInvestor(updatedCompanies.find(c => c.id === selectedCompany.id).investors.find(i => i.id === investorId));
    }
    setShowModal(null);
  };

  const addTransaction = (investorId, transaction) => {
    const updatedCompanies = companies.map(company => {
      if (company.id === selectedCompany.id) {
        return {
          ...company,
          investors: company.investors.map(inv => {
            if (inv.id === investorId) {
              const newTransaction = {
                ...transaction,
                amount: parseFloat(transaction.amount)
              };
              
              // Add the new transaction
              let updatedTransactions = [...inv.transactions, newTransaction];
              
              // Sort all transactions by date
              updatedTransactions.sort((a, b) => parseDate(a.date) - parseDate(b.date));
              
              // If the new transaction affects balance (investment, withdrawal, etc.)
              // Recalculate all future interest-earned transactions
              const shouldRecalculate = ['investment', 'withdrawal', 'adjustment', 'initial'].includes(transaction.type);
              
              if (shouldRecalculate) {
                console.log(`New ${transaction.type} transaction added for ${transaction.date}. Recalculating future interest...`);
                const transactionDate = parseDate(transaction.date);
                const currentRate = inv.interestRate;
                let futureUpdated = 0;
                
                updatedTransactions = updatedTransactions.map(t => {
                  const txDate = parseDate(t.date);
                  // Only update future interest-earned transactions
                  if (t.type === 'interest-earned' && txDate > transactionDate) {
                    // Calculate balance at the time of this transaction
                    const priorTransactions = updatedTransactions.filter(
                      pt => parseDate(pt.date) < txDate
                    );
                    
                    let balance = 0;
                    priorTransactions.forEach(pt => {
                      if (pt.type === 'initial' || pt.type === 'investment') {
                        balance += pt.amount;
                      } else if (pt.type === 'withdrawal') {
                        balance -= pt.amount;
                      } else if (pt.type === 'interest-earned') {
                        balance += pt.amount;
                      } else if (pt.type === 'interest-paid') {
                        balance -= pt.amount;
                      } else if (pt.type === 'adjustment' || pt.type === 'bonus') {
                        balance += pt.amount;
                      }
                    });
                    
                    // Calculate quarterly interest based on current rate
                    const quarterlyInterest = (balance * (currentRate / 100)) / 4;
                    
                    futureUpdated++;
                    
                    return {
                      ...t,
                      amount: parseFloat(quarterlyInterest.toFixed(2))
                    };
                  }
                  return t;
                });
                
                console.log(`Recalculation complete. ${futureUpdated} future interest transaction(s) updated.`);
              }
              
              return { 
                ...inv, 
                transactions: updatedTransactions
              };
            }
            return inv;
          })
        };
      }
      return company;
    });
    setCompanies(updatedCompanies);
    saveToStorage(updatedCompanies);
    setSelectedInvestor(updatedCompanies.find(c => c.id === selectedCompany.id).investors.find(i => i.id === investorId));
    setShowModal(null);
  };

  const deleteTransaction = (investorId, transactionIndex) => {
    if (!window.confirm('Are you sure you want to delete this transaction? This action cannot be undone.')) {
      return;
    }
    
    const updatedCompanies = companies.map(company => {
      if (company.id === selectedCompany.id) {
        return {
          ...company,
          investors: company.investors.map(inv => {
            if (inv.id === investorId) {
              const deletedTransaction = inv.transactions[transactionIndex];
              const deletedDate = parseDate(deletedTransaction.date);
              
              // Remove the transaction
              let updatedTransactions = inv.transactions.filter((_, index) => index !== transactionIndex);
              
              // If the deleted transaction affects balance, recalculate future interest
              const shouldRecalculate = ['investment', 'withdrawal', 'adjustment', 'initial'].includes(deletedTransaction.type);
              
              if (shouldRecalculate) {
                console.log(`Transaction deleted: ${deletedTransaction.type} on ${deletedTransaction.date}. Recalculating future interest...`);
                const currentRate = inv.interestRate;
                let futureUpdated = 0;
                
                updatedTransactions = updatedTransactions.map(t => {
                  const txDate = parseDate(t.date);
                  // Only update future interest-earned transactions
                  if (t.type === 'interest-earned' && txDate > deletedDate) {
                    // Calculate balance at the time of this transaction
                    const priorTransactions = updatedTransactions.filter(
                      pt => parseDate(pt.date) < txDate
                    );
                    
                    let balance = 0;
                    priorTransactions.forEach(pt => {
                      if (pt.type === 'initial' || pt.type === 'investment') {
                        balance += pt.amount;
                      } else if (pt.type === 'withdrawal') {
                        balance -= pt.amount;
                      } else if (pt.type === 'interest-earned') {
                        balance += pt.amount;
                      } else if (pt.type === 'interest-paid') {
                        balance -= pt.amount;
                      } else if (pt.type === 'adjustment' || pt.type === 'bonus') {
                        balance += pt.amount;
                      }
                    });
                    
                    // Calculate quarterly interest based on current rate
                    const quarterlyInterest = (balance * (currentRate / 100)) / 4;
                    
                    futureUpdated++;
                    
                    return {
                      ...t,
                      amount: parseFloat(quarterlyInterest.toFixed(2))
                    };
                  }
                  return t;
                });
                
                console.log(`Recalculation complete. ${futureUpdated} future interest transaction(s) updated.`);
              }
              
              return { 
                ...inv, 
                transactions: updatedTransactions
              };
            }
            return inv;
          })
        };
      }
      return company;
    });
    setCompanies(updatedCompanies);
    saveToStorage(updatedCompanies);
    setSelectedInvestor(updatedCompanies.find(c => c.id === selectedCompany.id).investors.find(i => i.id === investorId));
  };

  const processRateChange = (investorId, newRate, effectiveDate, reason, recalculateFuture = true) => {
    const investor = selectedCompany.investors.find(inv => inv.id === investorId);
    if (!investor) return;

    const oldRate = investor.interestRate;
    const effectiveDateObj = new Date(effectiveDate);
    
    console.log(`Processing rate change: ${oldRate}% → ${newRate}% effective ${effectiveDate}`);
    console.log(`Recalculate future transactions: ${recalculateFuture}`);
    
    const updatedCompanies = companies.map(company => {
      if (company.id === selectedCompany.id) {
        return {
          ...company,
          investors: company.investors.map(inv => {
            if (inv.id === investorId) {
              // Create updated investor with new rate
              let updatedInvestor = {
                ...inv,
                interestRate: parseFloat(newRate)
              };
              
              // Add rate-change transaction
              const rateChangeTransaction = {
                date: effectiveDate,
                type: 'rate-change',
                amount: 0,
                description: reason 
                  ? `RATE CHANGE: ${oldRate}% → ${newRate}% effective ${effectiveDate} - ${reason}` 
                  : `RATE CHANGE: ${oldRate}% → ${newRate}% effective ${effectiveDate}`,
                metadata: {
                  oldRate: oldRate,
                  newRate: parseFloat(newRate),
                  reason: reason
                }
              };
              
              updatedInvestor.transactions = [...updatedInvestor.transactions, rateChangeTransaction];
              
              // Sort all transactions by date
              updatedInvestor.transactions.sort((a, b) => parseDate(a.date) - parseDate(b.date));
              
              // Recalculate future interest if requested
              if (recalculateFuture) {
                console.log('Recalculating future interest transactions...');
                let futureUpdated = 0;
                
                updatedInvestor.transactions = updatedInvestor.transactions.map(t => {
                  const txDate = parseDate(t.date);
                  // Only update future interest-earned transactions
                  if (t.type === 'interest-earned' && txDate > effectiveDateObj) {
                    // Calculate balance at the time of this transaction
                    const priorTransactions = updatedInvestor.transactions.filter(
                      pt => parseDate(pt.date) < txDate
                    );
                    
                    let balance = 0;
                    priorTransactions.forEach(pt => {
                      if (pt.type === 'initial' || pt.type === 'investment') {
                        balance += pt.amount;
                      } else if (pt.type === 'withdrawal') {
                        balance -= pt.amount;
                      } else if (pt.type === 'interest-earned') {
                        balance += pt.amount;
                      } else if (pt.type === 'interest-paid') {
                        balance -= pt.amount;
                      } else if (pt.type === 'adjustment' || pt.type === 'bonus') {
                        balance += pt.amount;
                      }
                    });
                    
                    // Calculate quarterly interest based on new rate
                    const quarterlyInterest = (balance * (newRate / 100)) / 4;
                    
                    futureUpdated++;
                    
                    return {
                      ...t,
                      amount: parseFloat(quarterlyInterest.toFixed(2)),
                      description: t.description.replace(
                        /@\s*\d+(\.\d+)?%/,
                        `@ ${newRate}%`
                      )
                    };
                  }
                  return t;
                });
                
                console.log(`${futureUpdated} future interest transaction(s) recalculated.`);
                
                alert(`✅ Interest rate updated successfully!\n\n` +
                      `• Changed from ${oldRate}% to ${newRate}%\n` +
                      `• Effective date: ${effectiveDate}\n` +
                      `• Rate change transaction added\n` +
                      `• ${futureUpdated} future interest transaction(s) recalculated`);
              } else {
                console.log('Skipping recalculation of future transactions (user opted out).');
                alert(`✅ Interest rate updated successfully!\n\n` +
                      `• Changed from ${oldRate}% to ${newRate}%\n` +
                      `• Effective date: ${effectiveDate}\n` +
                      `• Rate change transaction added\n` +
                      `• 0 future interest transaction(s) recalculated`);
              }
              
              return updatedInvestor;
            }
            return inv;
          })
        };
      }
      return company;
    });
    
    setCompanies(updatedCompanies);
    saveToStorage(updatedCompanies);
    setSelectedInvestor(updatedCompanies.find(c => c.id === selectedCompany.id).investors.find(i => i.id === investorId));
    setShowModal(null);
  };

  const calculateQuarterlyInterest = (quarter, year, reinvest) => {
    if (!selectedInvestor) {
      alert('❌ No investor selected!');
      return;
    }

    const dates = getQuarterDates(quarter, year);
    
    // Calculate balance at start of quarter (i.e., ending balance from previous quarter)
    // This includes any interest that was earned/reinvested in the previous quarter
    let balanceAtQuarterStart = 0;
    const quarterStartDate = parseDate(formatDateForStorage(dates.start));
    
    selectedInvestor.transactions.forEach(tx => {
      const txDate = parseDate(tx.date);
      if (txDate < quarterStartDate) {
        if (['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type)) {
          balanceAtQuarterStart += tx.amount;
        } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type)) {
          balanceAtQuarterStart -= tx.amount;
        }
      }
    });
    
    // Calculate quarterly interest on the ending balance from previous quarter
    // Formula: ending balance from previous quarter × (rate / 100) / 4
    const interestAmount = balanceAtQuarterStart * (selectedInvestor.interestRate / 100) / 4;
    
    if (interestAmount <= 0) {
      alert('❌ No interest calculated. Check if the investor has a balance in this quarter.');
      return;
    }
    
    // Convert date from YYYY-MM-DD to DD-MMM-YYYY format
    const endDate = formatDateForStorage(dates.end);
    
    console.log('=== Calculate Interest Debug ===');
    console.log('Quarter:', quarter, year);
    console.log('Original date:', dates.end);
    console.log('Formatted date:', endDate);
    console.log('Ending balance from previous quarter:', balanceAtQuarterStart.toFixed(2));
    console.log('Interest rate:', selectedInvestor.interestRate + '%');
    console.log('Formula: $' + balanceAtQuarterStart.toFixed(2) + ' × ' + selectedInvestor.interestRate + '% ÷ 4');
    console.log('Interest amount:', interestAmount.toFixed(2));
    console.log('Reinvest:', reinvest);
    console.log('Investor:', selectedInvestor.name);
    console.log('Current transactions count:', selectedInvestor.transactions.length);

    // Get the updated companies structure
    const updatedCompanies = companies.map(company => {
      if (company.id === selectedCompany.id) {
        return {
          ...company,
          investors: company.investors.map(inv => {
            if (inv.id === selectedInvestor.id) {
              const updatedTransactions = [...inv.transactions];
              
              if (reinvest) {
                console.log('Adding 1 transaction: interest-earned (reinvested)');
                updatedTransactions.push({
                  date: endDate,
                  type: 'interest-earned',
                  amount: interestAmount,
                  description: `${quarter} ${year} Interest Earned/Reinvested @ ${inv.interestRate}%`
                });
              } else {
                console.log('Adding 2 transactions: interest-earned + interest-paid');
                updatedTransactions.push({
                  date: endDate,
                  type: 'interest-earned',
                  amount: interestAmount,
                  description: `${quarter} ${year} Interest Earned @ ${inv.interestRate}%`
                });
                updatedTransactions.push({
                  date: endDate,
                  type: 'interest-paid',
                  amount: interestAmount,
                  description: 'Interest paid'
                });
              }
              
              // Sort transactions by date
              updatedTransactions.sort((a, b) => parseDate(a.date) - parseDate(b.date));
              
              return {
                ...inv,
                transactions: updatedTransactions,
                reinvesting: reinvest
              };
            }
            return inv;
          })
        };
      }
      return company;
    });
    
    console.log('New transactions count:', updatedCompanies.find(c => c.id === selectedCompany.id).investors.find(i => i.id === selectedInvestor.id).transactions.length);
    
    // Update state and save
    setCompanies(updatedCompanies);
    saveToStorage(updatedCompanies);
    
    // Update selected investor
    const updatedInvestor = updatedCompanies
      .find(c => c.id === selectedCompany.id)
      .investors.find(i => i.id === selectedInvestor.id);
    setSelectedInvestor(updatedInvestor);
    
    alert(`✅ Interest calculated and added!\n\nAmount: $${interestAmount.toFixed(2)}\nQuarter: ${quarter} ${year}\nReinvested: ${reinvest ? 'Yes' : 'No (paid out)'}\n\nTransactions created: ${reinvest ? '1' : '2'}`);
  };

  const generateProfessionalStatement = (investor) => {
    const balance = calculateCurrentBalance(investor);
    const lifetimeInterest = calculateTotalInterest(investor);
    const currentYear = new Date().getFullYear();
    const yearlyInterest = calculateYearlyInterest(investor, currentYear);

    let runningBalance = 0;
    const rows = investor.transactions.map(tx => {
      if (['initial', 'investment', 'bonus'].includes(tx.type)) {
        runningBalance += tx.amount;
      } else if (tx.type === 'interest-earned') {
        runningBalance += tx.amount;
      } else if (tx.type === 'interest-paid') {
        runningBalance -= tx.amount;
      } else if (tx.type === 'adjustment') {
        runningBalance += tx.amount;
      } else if (['withdrawal', 'fee'].includes(tx.type)) {
        runningBalance -= tx.amount;
      }

      const credit = ['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type) && tx.amount > 0
        ? `$ ${tx.amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
        : '';
      
      const debit = (['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || (tx.type === 'adjustment' && tx.amount < 0))
        ? `$ ${Math.abs(tx.amount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
        : '';

      const bgColor = tx.type === 'rate-change' ? '#f8f9fa' : 
                     ['initial', 'bonus', 'adjustment'].includes(tx.type) ? '#e6e6e6' : '#fff';
      
      const balanceDisplay = tx.type === 'rate-change' ? '-' : 
                            `$ ${runningBalance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

      return `
        <tr style="background: ${bgColor}; ${tx.type === 'rate-change' ? 'font-style: italic;' : ''}">
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${formatDateForDisplay(tx.date)}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5;">${tx.description}${tx.metadata?.manualEntry ? ' 📝' : ''}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${credit}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${debit}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #e5e5e5; text-align: right;">${balanceDisplay}</td>
        </tr>
      `;
    }).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 850px; margin: 0 auto; background: white; padding: 40px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #004269; font-size: 32px; margin: 0; font-weight: bold; letter-spacing: 1px;">PATEL CAPITAL PARTNERS</h1>
          <p style="color: #666; margin: 8px 0; font-size: 14px; font-weight: 500;">Safety. Stability. Growth.</p>
        </div>

        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 15px; border-bottom: 2px solid #e5e5e5;">
          <div>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDateForDisplay(getTodayFormatted())}</p>
            <p style="margin: 5px 0;"><strong>Investor ID:</strong> ${investor.id}</p>
            <p style="margin: 5px 0;"><strong>Account Type:</strong> Fixed Rate</p>
          </div>
          <div style="text-align: right;">
            <p style="margin: 5px 0;"><strong>Interest Rate:</strong> ${investor.interestRate}%</p>
            <p style="margin: 5px 0; font-style: italic; color: #666;">*Note: ${investor.reinvesting ? 'Reinvesting/Compounding' : 'Interest Paid Out'}</p>
          </div>
        </div>

        <div style="background: #004269; color: white; padding: 15px 20px; margin-bottom: 20px; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; font-size: 16px;">Account holder:</h3>
          <p style="margin: 5px 0; font-weight: bold;">${investor.name}</p>
          <p style="margin: 5px 0;">${investor.address}</p>
          <p style="margin: 5px 0;">${investor.email} ${investor.phone}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background: #004269; color: white;">
              <th style="padding: 12px; text-align: left; font-size: 13px;">Date</th>
              <th style="padding: 12px; text-align: left; font-size: 13px;">Description</th>
              <th style="padding: 12px; text-align: right; font-size: 13px;">Credits</th>
              <th style="padding: 12px; text-align: right; font-size: 13px;">Interest Paid</th>
              <th style="padding: 12px; text-align: right; font-size: 13px;">Balance</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>

        <div style="background: #004269; color: white; padding: 20px; margin-bottom: 15px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between; font-size: 16px;">
            <strong>Account Current Balance</strong>
            <strong>$ ${balance.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
          </div>
        </div>

        <div style="background: #cfe2f3; padding: 15px 20px; margin-bottom: 10px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-style: italic;">Total Interest Earned ${currentYear}</span>
            <strong>$ ${yearlyInterest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
          </div>
        </div>

        <div style="background: #cfe2f3; padding: 15px 20px; margin-bottom: 40px; border-radius: 4px;">
          <div style="display: flex; justify-content: space-between;">
            <span style="font-style: italic;">Total Lifetime Interest Earned</span>
            <strong>$ ${lifetimeInterest.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong>
          </div>
        </div>

        <div style="text-align: center; border-top: 2px solid #004269; padding-top: 20px; margin-top: 40px;">
          <p style="font-weight: bold; color: #004269; margin: 10px 0; font-size: 16px;">Safety. Stability. Growth.</p>
          <p style="margin: 10px 0; font-size: 13px;">Should you have any enquiries concerning this statement, please contact us</p>
          <p style="margin: 5px 0; font-size: 13px;">6608 Brynhurst Dr., Tucker, GA, 30084</p>
          <p style="margin: 5px 0; font-size: 13px;">Tel: 404-723-8410 | E-mail: samir@patel-capital.net | Web: www.patel-capital.net</p>
        </div>
      </div>
    `;
  };

  const handleDownloadStatement = async () => {
    if (!selectedInvestor || !selectedCompany) return;
    
    // Auto-detects format based on company (Trophy Point or Patel Capital Partners default)
    await downloadStatement(selectedInvestor, selectedCompany);
  };

  const downloadCSV = () => {
    if (!selectedInvestor) return;
    
    const investor = selectedInvestor;
    let csv = [];
    
    csv.push(['Statement']);
    csv.push(['','','','','','','','','','','Statement','','','Blue']);
    csv.push(['','','','','','','','Date:',formatDateForDisplay(getTodayFormatted())]);
    csv.push(['','','','','','','','Investor ID:',investor.id,'','Fixed rate']);
    csv.push(['Safety. Stability. Growth.','','','','','','','Interest Rate:',investor.interestRate + '%']);
    csv.push(['','','','','','','','*Note:',investor.reinvesting ? 'Reinvesting/Compounding' : 'Interest Paid Out']);
    csv.push(['Account holder:']);
    csv.push([investor.name]);
    csv.push([investor.address]);
    csv.push([investor.email,investor.phone]);
    csv.push(['']);
    csv.push(['Date','Description','','','','','Credits','','Interest Paid','','Balance','','']);
    
    let runningBalance = 0;
    investor.transactions.forEach(tx => {
      if (['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type)) {
        runningBalance += tx.amount;
      } else if (tx.type === 'interest-paid') {
        runningBalance -= tx.amount;
      } else if (tx.type === 'adjustment') {
        runningBalance += tx.amount;
      } else if (['withdrawal', 'fee'].includes(tx.type)) {
        runningBalance -= tx.amount;
      }
      
      const row = ['','','','','','','','','','','','',''];
      row[0] = formatDateForDisplay(tx.date);
      row[1] = tx.description;
      
      if (['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type) || (tx.type === 'adjustment' && tx.amount > 0)) {
        row[6] = '$';
        row[7] = Math.abs(tx.amount).toFixed(2);
      }
      
      if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || (tx.type === 'adjustment' && tx.amount < 0)) {
        row[8] = '$';
        row[9] = Math.abs(tx.amount).toFixed(2);
      }
      
      if (tx.type !== 'rate-change') {
        row[10] = '$';
        row[11] = runningBalance.toFixed(2);
      }
      
      csv.push(row);
    });
    
    csv.push(['']);
    csv.push(['Account Current Balance','$' + calculateCurrentBalance(investor).toFixed(2)]);
    csv.push(['Total Lifetime Interest Earned','$' + calculateTotalInterest(investor).toFixed(2)]);
    
    const csvContent = csv.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedCompany.name}_${investor.name}_Statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredInvestors = selectedCompany?.investors.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <img 
              src="/patel-logo.png" 
              alt="PCP" 
              className="w-12 h-12 object-contain bg-white rounded-lg p-1"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            <div>
              <h1 className="text-2xl font-bold tracking-wider">PATEL CAPITAL</h1>
              <p className="text-sm text-blue-200">Building Generational Wealth</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right mr-4">
              <div className="text-sm font-semibold">{currentUser.name}</div>
              <div className="text-xs text-blue-200">
                {currentUser.role === 'admin' ? 'Administrator' : 'User'}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="px-4 py-2 bg-green-600/80 hover:bg-green-600 rounded-lg text-sm font-medium transition flex items-center gap-2"
              title="Refresh data from source"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600/80 hover:bg-red-600 rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-md p-2 flex gap-2 mb-6">
          {['companies', 'investors', 'records', 'statements'].map(section => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition ${
                activeSection === section
                  ? 'bg-blue-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
          {currentUser.role === 'admin' && (
            <button
              onClick={() => setActiveSection('users')}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
                activeSection === 'users'
                  ? 'bg-purple-600 text-white'
                  : 'text-purple-600 hover:bg-purple-50 border border-purple-200'
              }`}
            >
              <Users size={18} />
              Users
            </button>
          )}
        </div>

        {/* Companies Section */}
        {activeSection === 'companies' && (
          <div>
            <div className="mb-6 flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Investment Companies</h2>
                <p className="text-gray-600">Select a company to manage investor accounts</p>
              </div>
              {currentUser.role === 'admin' && (
                <button
                  onClick={() => {
                    setModalData({});
                    setShowModal('add-company');
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-lg"
                >
                  <Building2 size={20} />
                  Add Company
                </button>
              )}
              <button
                onClick={() => exportAllToExcel(companies, calculateCurrentBalance)}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold shadow-lg"
              >
                <FileSpreadsheet size={20} />
                Export All to Excel
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {companies.map(company => {
                const totalInvestment = company.investors.reduce((sum, inv) => sum + calculateCurrentBalance(inv), 0);
                return (
                  <div
                    key={company.id}
                    onClick={() => setSelectedCompany(company)}
                    onDoubleClick={() => {
                      setSelectedCompany(company);
                      setActiveSection('investors');
                    }}
                    className={`bg-white rounded-xl p-6 cursor-pointer transition transform hover:scale-105 border-2 ${
                      selectedCompany?.id === company.id 
                        ? 'border-blue-900 shadow-xl' 
                        : 'border-gray-200 shadow-md hover:border-blue-400'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{company.name}</h3>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-blue-900">{company.investors.length}</div>
                        <div className="text-xs text-gray-600 uppercase">Investors</div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg text-center">
                        <div className="text-2xl font-bold text-green-900">{(() => {
                          // Calculate weighted average interest rate
                          let totalWeightedRate = 0;
                          let totalPrincipal = 0;
                          
                          company.investors.forEach(investor => {
                            // Calculate principal for this investor
                            let principal = 0;
                            investor.transactions.forEach(tx => {
                              if (['initial', 'investment'].includes(tx.type)) {
                                principal += tx.amount;
                              } else if (tx.type === 'withdrawal') {
                                principal -= tx.amount;
                              }
                            });
                            
                            // Add to weighted rate calculation
                            totalWeightedRate += principal * investor.interestRate;
                            totalPrincipal += principal;
                          });
                          
                          // Calculate weighted average
                          const weightedAvgRate = totalPrincipal > 0 
                            ? (totalWeightedRate / totalPrincipal).toFixed(2) 
                            : '0.00';
                          
                          return `${weightedAvgRate}%`;
                        })()}</div>
                        <div className="text-xs text-gray-600 uppercase">Weighted Avg Rate</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t border-gray-200 text-center">
                      <div className="text-2xl font-bold text-gray-900">${totalInvestment.toLocaleString()}</div>
                      <div className="text-xs text-gray-600 uppercase">Total Investment</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Investors Section */}
        {activeSection === 'investors' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Investor Management</h2>
              <p className="text-gray-600">
                {selectedCompany ? `Managing ${selectedCompany.name}` : 'Select a company first'}
              </p>
            </div>
            {selectedCompany && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-6 flex justify-between items-center">
                  <h3 className="text-xl font-semibold">Investor Accounts</h3>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      placeholder="Search investors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="px-4 py-2 rounded-lg text-gray-900 text-sm"
                    />
                    <button
                      onClick={() => {
                        setModalData({});
                        setShowModal('add-investor');
                      }}
                      className="px-4 py-2 bg-white text-blue-900 rounded-lg hover:bg-blue-50 transition flex items-center gap-2 font-semibold"
                    >
                      <Plus size={18} />
                      Add Investor
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Investment</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Rate</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Status</th>
                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Balance</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredInvestors.map(investor => (
                        <tr 
                          key={investor.id} 
                          className="hover:bg-gray-50 cursor-pointer"
                          onDoubleClick={() => {
                            setSelectedInvestor(investor);
                            setActiveSection('records');
                          }}
                        >
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{investor.name}</div>
                            <div className="text-sm text-gray-500">{investor.id}</div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">{investor.email}</td>
                          <td className="px-6 py-4 text-center font-semibold">${(() => {
                            let totalInvested = 0;
                            investor.transactions.forEach(tx => {
                              if (['initial', 'investment'].includes(tx.type)) {
                                totalInvested += tx.amount;
                              } else if (tx.type === 'withdrawal') {
                                totalInvested -= tx.amount;
                              }
                            });
                            return totalInvested.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
                          })()}</td>
                          <td className="px-6 py-4 text-center font-semibold">{investor.interestRate}%</td>
                          <td className="px-6 py-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              investor.reinvesting 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {investor.reinvesting ? 'Reinvesting' : 'Payout'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right font-bold text-blue-900">
                            ${calculateCurrentBalance(investor).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative flex justify-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenDropdownId(openDropdownId === investor.id ? null : investor.id);
                                }}
                                className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                                title="Actions"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {openDropdownId === investor.id && (
                                <div className="absolute right-0 top-10 z-50 w-56 bg-white rounded-lg shadow-xl border border-gray-200 py-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setActiveSection('records');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-blue-50 text-gray-700 hover:text-blue-900"
                                  >
                                    <Eye size={16} />
                                    <span>View Records</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setActiveSection('statements');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-blue-50 text-gray-700 hover:text-blue-900"
                                  >
                                    <FileText size={16} />
                                    <span>Generate Statement</span>
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setModalData(investor);
                                      setShowModal('edit-investor');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-blue-50 text-gray-700 hover:text-blue-900"
                                  >
                                    <Edit size={16} />
                                    <span>Edit Investor</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setModalData(investor);
                                      setShowModal('change-rate');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-purple-50 text-gray-700 hover:text-purple-900"
                                  >
                                    <TrendingUp size={16} />
                                    <span>Change Interest Rate</span>
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setModalData({});
                                      setShowModal('add-investment');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-green-50 text-gray-700 hover:text-green-900"
                                  >
                                    <DollarSign size={16} />
                                    <span>Add Investment</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setModalData({});
                                      setShowModal('withdrawal');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-red-50 text-gray-700 hover:text-red-900"
                                  >
                                    <ArrowDownCircle size={16} />
                                    <span>Process Withdrawal</span>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setModalData({});
                                      setShowModal('manual-transaction');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-orange-50 text-gray-700 hover:text-orange-900"
                                  >
                                    <PlusCircle size={16} />
                                    <span>Manual Transaction</span>
                                  </button>
                                  <div className="border-t border-gray-200 my-1"></div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedInvestor(investor);
                                      setShowModal('send-email');
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-indigo-50 text-gray-700 hover:text-indigo-900"
                                  >
                                    <Mail size={16} />
                                    <span>Send Email Notification</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Records Section */}
        {activeSection === 'records' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Transaction Records</h2>
              <p className="text-gray-600">
                {selectedInvestor ? `Viewing records for ${selectedInvestor.name}` : 'Select an investor first'}
              </p>
            </div>
            {selectedInvestor && (
              <div>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-blue-600">
                    <h4 className="text-xs text-gray-600 uppercase mb-2">Current Balance</h4>
                    <div className="text-2xl font-bold text-blue-900">
                      ${calculateCurrentBalance(selectedInvestor).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-green-600">
                    <h4 className="text-xs text-gray-600 uppercase mb-2">Interest Rate</h4>
                    <div className="text-2xl font-bold text-green-900">
                      {selectedInvestor.interestRate}%
                    </div>
                    {(() => {
                      const weightedInfo = calculateNextQuarterWeightedRate(selectedInvestor);
                      if (weightedInfo) {
                        return (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-600 mb-1">Next Quarter Weighted Rate:</div>
                            <div className="text-lg font-bold text-orange-600">{weightedInfo.weightedRate}%</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {weightedInfo.oldRate}% ({weightedInfo.daysBeforeChange}d) → {weightedInfo.newRate}% ({weightedInfo.daysAfterChange}d)
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-purple-600">
                    <h4 className="text-xs text-gray-600 uppercase mb-2">2025 Interest</h4>
                    <div className="text-2xl font-bold text-purple-900">
                      ${calculateYearlyInterest(selectedInvestor, 2025).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-6 shadow-md border-t-4 border-orange-600">
                    <h4 className="text-xs text-gray-600 uppercase mb-2">Lifetime Interest</h4>
                    <div className="text-2xl font-bold text-orange-900">
                      ${calculateTotalInterest(selectedInvestor).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <button
                      onClick={() => {
                        setModalData({});
                        setShowModal('add-investment');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition border border-green-200"
                    >
                      <DollarSign size={18} />
                      <span className="font-medium">Add Investment</span>
                    </button>
                    <button
                      onClick={() => {
                        setModalData({});
                        setShowModal('withdrawal');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition border border-red-200"
                    >
                      <ArrowDownCircle size={18} />
                      <span className="font-medium">Withdrawal</span>
                    </button>
                    <button
                      onClick={() => {
                        setModalData({});
                        setShowModal('manual-transaction');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition border border-orange-200"
                    >
                      <PlusCircle size={18} />
                      <span className="font-medium">Manual Transaction</span>
                    </button>
                    <button
                      onClick={() => {
                        setModalData(selectedInvestor);
                        setShowModal('change-rate');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition border border-purple-200"
                    >
                      <TrendingUp size={18} />
                      <span className="font-medium">Change Rate</span>
                    </button>
                    <button
                      onClick={() => {
                        setModalData(selectedInvestor);
                        setShowModal('edit-investor');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition border border-blue-200"
                    >
                      <Edit size={18} />
                      <span className="font-medium">Edit Investor</span>
                    </button>
                    <button
                      onClick={() => {
                        setActiveSection('statements');
                      }}
                      className="flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
                    >
                      <FileText size={18} />
                      <span className="font-medium">Generate Statement</span>
                    </button>
                    <button
                      onClick={() => exportToExcel(selectedInvestor, selectedCompany, calculateCurrentBalance)}
                      className="flex items-center gap-3 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition border border-emerald-200"
                    >
                      <FileSpreadsheet size={18} />
                      <span className="font-medium">Download Excel</span>
                    </button>
                    <button
                      onClick={downloadCSV}
                      className="flex items-center gap-3 px-4 py-3 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition border border-teal-200"
                    >
                      <Download size={18} />
                      <span className="font-medium">Download CSV</span>
                    </button>
                  </div>
                </div>

                {/* Interest Calculator */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-6">
                  <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
                    <h3 className="text-xl font-semibold mb-4">Calculate Quarterly Interest</h3>
                    <div className="flex flex-wrap gap-4 items-end">
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium mb-2">Quarter</label>
                        <select
                          id="quarter-select"
                          defaultValue="Q4"
                          className="w-full px-4 py-2 rounded-lg text-gray-900"
                        >
                          <option value="Q1">Q1 (Jan-Mar)</option>
                          <option value="Q2">Q2 (Apr-Jun)</option>
                          <option value="Q3">Q3 (Jul-Sep)</option>
                          <option value="Q4">Q4 (Oct-Dec)</option>
                        </select>
                      </div>
                      <div className="flex-1 min-w-[150px]">
                        <label className="block text-sm font-medium mb-2">Year</label>
                        <input
                          id="year-input"
                          type="number"
                          defaultValue={2025}
                          min={2020}
                          max={2030}
                          className="w-full px-4 py-2 rounded-lg text-gray-900"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          id="reinvest-check"
                          type="checkbox"
                          defaultChecked={selectedInvestor.reinvesting}
                          className="w-5 h-5"
                        />
                        <label className="text-sm font-medium">Auto-Reinvest</label>
                      </div>
                      <button
                        onClick={() => {
                          const quarter = document.getElementById('quarter-select').value;
                          const year = parseInt(document.getElementById('year-input').value);
                          const reinvest = document.getElementById('reinvest-check').checked;
                          calculateQuarterlyInterest(quarter, year, reinvest);
                        }}
                        className="px-6 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition font-semibold"
                      >
                        Calculate Interest
                      </button>
                    </div>
                  </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-gray-50 px-6 py-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">Transaction History</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Description</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Credits</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Debits</th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Balance</th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(() => {
                          let runningBalance = 0;
                          return selectedInvestor.transactions.map((tx, idx) => {
                            if (['initial', 'investment', 'bonus'].includes(tx.type)) {
                              runningBalance += tx.amount;
                            } else if (tx.type === 'interest-earned') {
                              runningBalance += tx.amount;
                            } else if (tx.type === 'interest-paid') {
                              runningBalance -= tx.amount;
                            } else if (tx.type === 'adjustment') {
                              runningBalance += tx.amount;
                            } else if (['withdrawal', 'fee'].includes(tx.type)) {
                              runningBalance -= tx.amount;
                            }

                            const isRateChange = tx.type === 'rate-change';
                            const balanceDisplay = isRateChange ? '-' : `$${runningBalance.toLocaleString()}`;

                            return (
                              <tr key={idx} className={`hover:bg-gray-50 ${isRateChange ? 'bg-gray-50 italic' : ''}`}>
                                <td className="px-6 py-4 text-sm">{formatDateForDisplay(tx.date)}</td>
                                <td className="px-6 py-4 text-sm">
                                  {tx.description}
                                  {tx.metadata?.manualEntry && <span className="ml-2">📝</span>}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-green-600 font-semibold">
                                  {(['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type) || 
                                    (tx.type === 'adjustment' && tx.amount > 0)) 
                                    ? `$${Math.abs(tx.amount).toLocaleString()}` 
                                    : ''}
                                </td>
                                <td className="px-6 py-4 text-sm text-right text-red-600 font-semibold">
                                  {(['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || 
                                    (tx.type === 'adjustment' && tx.amount < 0)) 
                                    ? `$${Math.abs(tx.amount).toLocaleString()}` 
                                    : ''}
                                </td>
                                <td className="px-6 py-4 text-sm text-right font-bold">
                                  {balanceDisplay}
                                </td>
                                <td className="px-6 py-4 text-sm text-center">
                                  <button
                                    onClick={() => {
                                      setModalData({ transaction: tx, transactionIndex: idx });
                                      setShowModal('edit-transaction');
                                    }}
                                    className="text-blue-600 hover:text-blue-800 transition"
                                    title="Edit transaction"
                                  >
                                    <Edit size={16} />
                                  </button>
                                </td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Statements Section */}
        {activeSection === 'statements' && (
          <div>
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Statement Generation</h2>
              <p className="text-gray-600">
                {selectedInvestor ? `Viewing statement for ${selectedInvestor.name}` : 'Select an investor first'}
              </p>
            </div>
            {selectedInvestor && (
              <div>
                <div className="mb-6 flex gap-4 no-print">
                  <button
                    onClick={handleDownloadStatement}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold shadow-lg"
                  >
                    <Download size={20} />
                    Download/Print PDF
                  </button>
                  <button
                    onClick={downloadCSV}
                    className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold shadow-lg"
                  >
                    <Download size={20} />
                    Download CSV
                  </button>
                  <button
                    onClick={() => exportToExcel(selectedInvestor, selectedCompany, calculateCurrentBalance)}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-semibold shadow-lg"
                  >
                    <FileSpreadsheet size={20} />
                    Download Excel
                  </button>
                </div>
                <div 
                  className="bg-white rounded-xl shadow-2xl overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: generateProfessionalStatement(selectedInvestor) }}
                />
              </div>
            )}
          </div>
        )}

        {/* User Management Section (Admin Only) */}
        {activeSection === 'users' && currentUser.role === 'admin' && (
          <UserManagement />
        )}
      </div>

      {/* Modals */}
      {showModal === 'add-investor' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Add New Investor</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addInvestor({
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  address: formData.get('address'),
                  initialInvestment: formData.get('initialInvestment'),
                  interestRate: formData.get('interestRate'),
                  startDate: formData.get('startDate'),
                  reinvesting: formData.get('reinvesting') === 'on'
                });
              }}
              className="p-6"
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                  <input
                    name="interestRate"
                    type="number"
                    step="0.01"
                    defaultValue="10.00"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Investment</label>
                  <input
                    name="initialInvestment"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    name="reinvesting"
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5"
                  />
                  <label className="text-sm font-medium text-gray-700">Auto-Reinvest Interest</label>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  Add Investor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'edit-investor' && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white">
              <h3 className="text-xl font-bold">Edit Investor Details</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                updateInvestor(modalData.id, {
                  name: formData.get('name'),
                  email: formData.get('email'),
                  phone: formData.get('phone'),
                  address: formData.get('address'),
                  initialInvestment: formData.get('initialInvestment'),
                  interestRate: formData.get('interestRate'),
                  startDate: formData.get('startDate'),
                  reinvesting: formData.get('reinvesting') === 'on'
                });
              }}
              className="p-6"
            >
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                  <input
                    name="name"
                    type="text"
                    defaultValue={modalData.name}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    defaultValue={modalData.email}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={modalData.phone}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Interest Rate (%)</label>
                  <input
                    name="interestRate"
                    type="number"
                    step="0.01"
                    defaultValue={modalData.interestRate}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  <textarea
                    name="address"
                    rows="2"
                    defaultValue={modalData.address}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Investment</label>
                  <input
                    name="initialInvestment"
                    type="number"
                    step="0.01"
                    defaultValue={modalData.initialInvestment}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input
                    name="startDate"
                    type="date"
                    defaultValue={modalData.startDate}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    name="reinvesting"
                    type="checkbox"
                    defaultChecked={modalData.reinvesting}
                    className="w-5 h-5"
                  />
                  <label className="text-sm font-medium text-gray-700">Auto-Reinvest Interest</label>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'change-rate' && modalData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Change Interest Rate</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newRate = parseFloat(formData.get('newRate'));
                const effectiveDate = formatDateForStorage(formData.get('effectiveDate'));
                const reason = formData.get('reason');
                const recalculateFuture = formData.get('recalculateFuture') === 'on';
                
                processRateChange(modalData.id, newRate, effectiveDate, reason, recalculateFuture);
              }}
              className="p-6"
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Rate (%)</label>
                  <input
                    type="number"
                    value={modalData.interestRate}
                    readOnly
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Rate (%)</label>
                  <input
                    name="newRate"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Effective Date</label>
                  <input
                    name="effectiveDate"
                    type="date"
                    id="effectiveDate"
                    defaultValue={formatDateForInput(getTodayFormatted())}
                    required
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const checkbox = document.getElementById('recalculateFutureCheckbox');
                      if (checkbox) {
                        checkbox.style.display = selectedDate < today ? 'block' : 'none';
                      }
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                {/* Conditional checkbox for past effective dates */}
                <div id="recalculateFutureCheckbox" style={{ display: 'none' }} className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="recalculateFuture"
                      defaultChecked={true}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-semibold text-gray-900">Recalculate Future Interest Transactions</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ⚠️ The effective date is in the past. Check this to automatically recalculate all interest 
                        transactions that occur AFTER the effective date using the new rate.
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        💡 Uncheck if you only want to add the rate change transaction without affecting existing interest records.
                      </div>
                    </div>
                  </label>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Change</label>
                  <input
                    name="reason"
                    type="text"
                    placeholder="e.g., Market adjustment, Performance review"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  Update Rate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'add-investment' && selectedInvestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Additional Investment</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addTransaction(selectedInvestor.id, {
                  date: formatDateForStorage(formData.get('date')),
                  type: 'investment',
                  amount: formData.get('amount'),
                  description: formData.get('description'),
                  metadata: {
                    proratedCalculation: formData.get('prorated') === 'on'
                  }
                });
              }}
              className="p-6"
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Amount ($)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={formatDateForInput(getTodayFormatted())}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    name="description"
                    type="text"
                    defaultValue="Additional Investment"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    name="prorated"
                    type="checkbox"
                    defaultChecked
                    className="w-5 h-5"
                  />
                  <label className="text-sm font-medium text-gray-700">Calculate prorated interest from investment date</label>
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  Add Investment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showModal === 'manual-transaction' && selectedInvestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Add Manual Transaction</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addTransaction(selectedInvestor.id, {
                  date: formatDateForStorage(formData.get('date')),
                  type: formData.get('type'),
                  amount: formData.get('amount'),
                  description: formData.get('description'),
                  metadata: {
                    manualEntry: true
                  }
                });
              }}
              className="p-6"
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Type</label>
                  <select
                    name="type"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Type</option>
                    <option value="investment">Additional Investment</option>
                    <option value="withdrawal">Withdrawal</option>
                    <option value="bonus">Bonus Payment</option>
                    <option value="fee">Fee/Charge</option>
                    <option value="adjustment">Balance Adjustment</option>
                    <option value="interest-earned">Interest Earned</option>
                    <option value="interest-paid">Interest Paid Out</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={formatDateForInput(getTodayFormatted())}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    name="description"
                    type="text"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition font-semibold"
                >
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showModal === 'withdrawal' && selectedInvestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-red-700">Process Withdrawal</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const withdrawalType = formData.get('withdrawal_type');
                const amount = parseFloat(formData.get('amount'));
                
                addTransaction(selectedInvestor.id, {
                  date: formatDateForStorage(formData.get('date')),
                  type: 'withdrawal',
                  amount: amount,
                  description: formData.get('description') || `${withdrawalType === 'full' ? 'Full' : 'Partial'} Withdrawal`,
                  metadata: {
                    withdrawal_type: withdrawalType,
                    notes: formData.get('notes')
                  }
                });
              }}
              className="p-6"
            >
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-0.5">
                    <ArrowDownCircle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-blue-900">Current Balance</p>
                    <p className="text-2xl font-bold text-blue-700">
                      ${calculateCurrentBalance(selectedInvestor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Type</label>
                  <select
                    name="withdrawal_type"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    onChange={(e) => {
                      const form = e.target.form;
                      const amountInput = form.querySelector('[name="amount"]');
                      if (e.target.value === 'full') {
                        amountInput.value = calculateCurrentBalance(selectedInvestor).toFixed(2);
                        amountInput.readOnly = true;
                      } else {
                        amountInput.value = '';
                        amountInput.readOnly = false;
                      }
                    }}
                  >
                    <option value="partial">Partial Withdrawal</option>
                    <option value="full">Full Redemption (Close Account)</option>
                    <option value="interest">Interest Payment Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Amount ($)</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={calculateCurrentBalance(selectedInvestor)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Enter amount"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum available: ${calculateCurrentBalance(selectedInvestor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Withdrawal Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={formatDateForInput(getTodayFormatted())}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    name="description"
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="e.g., Partial redemption, Account closure"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    name="notes"
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Additional notes about this withdrawal..."
                  ></textarea>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Warning:</strong> Withdrawals reduce the principal balance and will affect future interest calculations.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold"
                >
                  Process Withdrawal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Company Modal (Admin Only) */}
      {showModal === 'add-company' && currentUser.role === 'admin' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold">Add New Company</h3>
              <button onClick={() => setShowModal(null)} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                addCompany({
                  name: formData.get('name'),
                  defaultRate: formData.get('defaultRate')
                });
              }}
              className="p-6"
            >
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                  <input
                    name="name"
                    type="text"
                    placeholder="e.g., ABC Capital Partners"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Default Interest Rate (%)</label>
                  <input
                    name="defaultRate"
                    type="number"
                    step="0.01"
                    defaultValue="10.00"
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                >
                  Add Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Email Notification Modal */}
      {showModal === 'send-email' && selectedInvestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-indigo-600 to-indigo-500">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Mail size={24} />
                Send Email Notification
              </h3>
              <button onClick={() => setShowModal(null)} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                
                // In a real application, this would send to a backend API
                const emailData = {
                  to: selectedInvestor.email,
                  subject: formData.get('subject'),
                  message: formData.get('message'),
                  attachStatement: formData.get('attach_statement') === 'on',
                  investor: selectedInvestor.name,
                  company: selectedCompany.name,
                  currentBalance: calculateCurrentBalance(selectedInvestor)
                };
                
                // Simulate sending email
                console.log('Sending email:', emailData);
                alert(`Email sent successfully to ${selectedInvestor.email}!\n\nSubject: ${emailData.subject}\n\nIn production, this would send via your email service.`);
                setShowModal(null);
              }}
              className="p-6"
            >
              <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Mail className="text-indigo-600 mt-1" size={20} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-indigo-900">Sending to:</p>
                    <p className="text-lg font-bold text-indigo-700">{selectedInvestor.name}</p>
                    <p className="text-sm text-indigo-600">{selectedInvestor.email}</p>
                    <div className="mt-2 text-xs text-indigo-700">
                      <span className="font-semibold">Current Balance:</span> ${calculateCurrentBalance(selectedInvestor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                  <input
                    name="subject"
                    type="text"
                    defaultValue={`Your Investment Statement - ${selectedCompany.name}`}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Enter email subject"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                  <textarea
                    name="message"
                    rows="8"
                    defaultValue={`Dear ${selectedInvestor.name},

Please find your investment statement for ${selectedCompany.name} attached to this email.

Current Investment Balance: $${calculateCurrentBalance(selectedInvestor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
Interest Rate: ${selectedInvestor.interestRate}%

If you have any questions or concerns, please don't hesitate to reach out.

Best regards,
${selectedCompany.name} Team`}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-mono text-sm"
                    placeholder="Enter your message..."
                  ></textarea>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    name="attach_statement"
                    id="attach_statement"
                    defaultChecked
                    className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="attach_statement" className="text-sm font-medium text-gray-700 cursor-pointer">
                    Attach PDF Statement to email
                  </label>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>📧 Note:</strong> In production, this will send emails via your configured email service (SendGrid, AWS SES, etc.). 
                  Currently running in demo mode.
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(null)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-semibold flex items-center gap-2"
                >
                  <Mail size={18} />
                  Send Email
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {showModal === 'edit-transaction' && modalData?.transaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-blue-600 to-indigo-600">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Edit size={24} />
                Edit Transaction
              </h3>
              <button onClick={() => {
                setShowModal(null);
                setModalData(null);
              }} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>
            
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updateScope = formData.get('update_scope');
                const transactionType = formData.get('type');
                
                const updatedTransaction = {
                  ...modalData.transaction,
                  type: transactionType,
                  date: formatDateForStorage(formData.get('date')),
                  amount: transactionType === 'rate-change' ? 0 : parseFloat(formData.get('amount') || 0),
                  description: formData.get('description'),
                  metadata: {
                    ...modalData.transaction.metadata,
                    edited: true,
                    editedAt: new Date().toISOString(),
                    ...(transactionType === 'rate-change' && {
                      oldRate: parseFloat(formData.get('oldRate') || 0),
                      newRate: parseFloat(formData.get('newRate') || 0)
                    })
                  }
                };
                
                const updatedInvestor = { ...selectedInvestor };
                const txIndex = modalData.transactionIndex;
                
                if (updateScope === 'single') {
                  // Update only this transaction
                  updatedInvestor.transactions[txIndex] = updatedTransaction;
                } else if (updateScope === 'future') {
                  // Update this and all future transactions
                  updatedInvestor.transactions[txIndex] = updatedTransaction;
                  
                  // Recalculate all future interest transactions based on new balance
                  // Get the running balance up to this transaction
                  let runningBalance = 0;
                  for (let i = 0; i <= txIndex; i++) {
                    const tx = i === txIndex ? updatedTransaction : updatedInvestor.transactions[i];
                    if (['initial', 'investment', 'bonus'].includes(tx.type)) {
                      runningBalance += tx.amount;
                    } else if (tx.type === 'interest-earned') {
                      runningBalance += tx.amount;
                    } else if (tx.type === 'interest-paid') {
                      runningBalance -= tx.amount;
                    } else if (tx.type === 'adjustment') {
                      runningBalance += tx.amount;
                    } else if (['withdrawal', 'fee'].includes(tx.type)) {
                      runningBalance -= tx.amount;
                    }
                  }
                  
                  // Recalculate future interest-earned transactions
                  for (let i = txIndex + 1; i < updatedInvestor.transactions.length; i++) {
                    const tx = updatedInvestor.transactions[i];
                    
                    if (tx.type === 'interest-earned' && !tx.description.includes('Disbursement')) {
                      // Get the month of this interest transaction
                      const txDate = new Date(tx.date);
                      const month = txDate.getMonth();
                      const year = txDate.getFullYear();
                      
                      // Calculate days in the month
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      
                      // Recalculate interest based on current running balance
                      const newInterest = (runningBalance * (selectedInvestor.interestRate / 100) * daysInMonth) / 365;
                      
                      updatedInvestor.transactions[i] = {
                        ...tx,
                        amount: parseFloat(newInterest.toFixed(2)),
                        metadata: {
                          ...tx.metadata,
                          recalculated: true,
                          recalculatedAt: new Date().toISOString(),
                          originalAmount: tx.amount
                        }
                      };
                      
                      runningBalance += parseFloat(newInterest.toFixed(2));
                    } else {
                      // Update running balance for other transaction types
                      if (['initial', 'investment', 'bonus'].includes(tx.type)) {
                        runningBalance += tx.amount;
                      } else if (tx.type === 'interest-earned') {
                        runningBalance += tx.amount;
                      } else if (tx.type === 'interest-paid') {
                        runningBalance -= tx.amount;
                      } else if (tx.type === 'adjustment') {
                        runningBalance += tx.amount;
                      } else if (['withdrawal', 'fee'].includes(tx.type)) {
                        runningBalance -= tx.amount;
                      }
                    }
                  }
                  
                  alert(`Updated transaction and recalculated ${updatedInvestor.transactions.length - txIndex - 1} future transactions.`);
                }
                
                // Update the investor in the company
                const updatedCompany = {
                  ...selectedCompany,
                  investors: selectedCompany.investors.map(inv => 
                    inv.id === selectedInvestor.id ? updatedInvestor : inv
                  )
                };
                
                // Update companies state
                const updatedCompanies = companies.map(comp =>
                  comp.id === selectedCompany.id ? updatedCompany : comp
                );
                
                setCompanies(updatedCompanies);
                saveToStorage(updatedCompanies);
                setSelectedInvestor(updatedInvestor);
                setShowModal(null);
                setModalData(null);
              }}
              className="p-6"
            >
              {/* Transaction Info Display */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Current Transaction</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-semibold capitalize">{modalData.transaction.type.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Date:</span>
                    <span className="ml-2 font-semibold">{formatDateForDisplay(modalData.transaction.date)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Original Amount:</span>
                    <span className="ml-2 font-semibold">${modalData.transaction.amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-semibold">Transaction #{modalData.transactionIndex + 1} of {selectedInvestor.transactions.length}</span>
                  </div>
                </div>
              </div>

              {/* Edit Form Fields */}
              <div className="space-y-4 mb-6">
                {/* Transaction Category/Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Category</label>
                  <select
                    name="type"
                    defaultValue={modalData.transaction.type}
                    onChange={(e) => {
                      // Update modal to show different fields based on category
                      setModalData({
                        ...modalData,
                        transaction: {
                          ...modalData.transaction,
                          type: e.target.value
                        }
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="initial">💰 Initial Investment</option>
                    <option value="investment">➕ Additional Investment</option>
                    <option value="withdrawal">➖ Withdrawal</option>
                    <option value="interest-earned">📈 Interest Earned</option>
                    <option value="interest-paid">💸 Interest Paid</option>
                    <option value="adjustment">🔧 Adjustment/Correction</option>
                    <option value="rate-change">📊 Rate Change</option>
                    <option value="bonus">🎁 Bonus</option>
                    <option value="fee">💳 Fee</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    {modalData.transaction.type === 'initial' && '💡 The first investment amount'}
                    {modalData.transaction.type === 'investment' && '💡 Additional money invested'}
                    {modalData.transaction.type === 'withdrawal' && '💡 Money taken out'}
                    {modalData.transaction.type === 'interest-earned' && '💡 Interest accrued (increases balance)'}
                    {modalData.transaction.type === 'interest-paid' && '💡 Interest paid out (decreases balance)'}
                    {modalData.transaction.type === 'adjustment' && '💡 Corrections or adjustments to balance'}
                    {modalData.transaction.type === 'rate-change' && '💡 Change in interest rate (no balance impact)'}
                    {modalData.transaction.type === 'bonus' && '💡 Special bonuses (increases balance)'}
                    {modalData.transaction.type === 'fee' && '💡 Fees charged (decreases balance)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
                  <input
                    name="date"
                    type="date"
                    defaultValue={formatDateForInput(modalData.transaction.date)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Amount field - hide for rate-change */}
                {modalData.transaction.type !== 'rate-change' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                      {['withdrawal', 'interest-paid', 'fee'].includes(modalData.transaction.type) && 
                        <span className="text-red-600 ml-1">(Debit)</span>
                      }
                      {['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(modalData.transaction.type) && 
                        <span className="text-green-600 ml-1">(Credit)</span>
                      }
                    </label>
                    <input
                      name="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={modalData.transaction.amount}
                      required
                      placeholder="0.00"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Special fields for Rate Change */}
                {modalData.transaction.type === 'rate-change' && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Old Rate (%)</label>
                      <input
                        name="oldRate"
                        type="number"
                        step="0.01"
                        defaultValue={modalData.transaction.metadata?.oldRate || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">New Rate (%)</label>
                      <input
                        name="newRate"
                        type="number"
                        step="0.01"
                        defaultValue={modalData.transaction.metadata?.newRate || ''}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    name="description"
                    rows="3"
                    defaultValue={modalData.transaction.description}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Category-specific helper text */}
                {modalData.transaction.type === 'interest-earned' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
                    💡 <strong>Tip:</strong> Interest earned increases the balance. For reinvesting accounts, 
                    this stays in the account. For non-reinvesting accounts, you'll need a matching "Interest Paid" transaction.
                  </div>
                )}
                
                {modalData.transaction.type === 'adjustment' && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    ⚠️ <strong>Note:</strong> Adjustments will trigger recalculation of future interest. 
                    Make sure the amount is correct. Use positive for credits, negative for debits.
                  </div>
                )}

                {['investment', 'withdrawal'].includes(modalData.transaction.type) && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded text-xs text-green-800">
                    💡 <strong>Tip:</strong> This will automatically recalculate all future interest transactions 
                    based on the new balance after this {modalData.transaction.type}.
                  </div>
                )}

                {/* Update Scope Selection */}
                <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
                  <label className="block text-sm font-bold text-gray-900 mb-3">
                    ⚠️ Update Scope - How should this change affect other transactions?
                  </label>
                  <div className="space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="update_scope"
                        value="single"
                        defaultChecked
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">Update This Transaction Only</div>
                        <div className="text-sm text-gray-600">
                          Only this transaction will be changed. Future balances and interest calculations 
                          will NOT be recalculated.
                        </div>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="update_scope"
                        value="future"
                        className="mt-1"
                      />
                      <div>
                        <div className="font-semibold text-gray-900">Update This and All Future Transactions</div>
                        <div className="text-sm text-gray-600">
                          This transaction and all subsequent interest calculations will be recalculated. 
                          This will affect {selectedInvestor.transactions.length - modalData.transactionIndex - 1} future transactions.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(null);
                    setModalData(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const transactionIndex = modalData.transactionIndex;
                    const investorId = selectedInvestor.id;
                    setShowModal(null);
                    setModalData(null);
                    deleteTransaction(investorId, transactionIndex);
                  }}
                  className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-semibold shadow-lg flex items-center justify-center gap-2"
                >
                  <Trash2 size={18} />
                  Delete
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold shadow-lg"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatelCapitalSystem;
