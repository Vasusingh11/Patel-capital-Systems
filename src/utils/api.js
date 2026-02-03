// API Service for Patel Capital System
// Connects frontend to the PostgreSQL backend

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

// Token management
let authToken = localStorage.getItem('PatelCapitalToken');

export const setToken = (token) => {
  authToken = token;
  if (token) {
    localStorage.setItem('PatelCapitalToken', token);
  } else {
    localStorage.removeItem('PatelCapitalToken');
  }
};

export const getToken = () => authToken;

// Generic fetch wrapper with auth
const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
};

// ============ AUTH API ============

export const apiLogin = async (email, password) => {
  const data = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  if (data.success && data.data.token) {
    setToken(data.data.token);
  }
  
  return data;
};

export const apiLogout = () => {
  setToken(null);
  localStorage.removeItem('PatelCapitalAuth');
};

export const apiGetCurrentUser = async () => {
  return apiFetch('/auth/me');
};

// ============ COMPANIES API ============

export const apiGetCompanies = async () => {
  return apiFetch('/companies');
};

export const apiGetCompany = async (id) => {
  return apiFetch(`/companies/${id}`);
};

export const apiCreateCompany = async (companyData) => {
  return apiFetch('/companies', {
    method: 'POST',
    body: JSON.stringify(companyData),
  });
};

export const apiUpdateCompany = async (id, companyData) => {
  return apiFetch(`/companies/${id}`, {
    method: 'PUT',
    body: JSON.stringify(companyData),
  });
};

// ============ INVESTORS API ============

export const apiGetInvestors = async (companyId = null, includeArchived = true) => {
  const params = new URLSearchParams();
  if (companyId) params.append('company_id', companyId);
  if (includeArchived) params.append('include_archived', 'true');
  const query = params.toString() ? `?${params.toString()}` : '';
  return apiFetch(`/investors${query}`);
};

export const apiGetInvestor = async (id) => {
  return apiFetch(`/investors/${id}`);
};

export const apiCreateInvestor = async (investorData) => {
  return apiFetch('/investors', {
    method: 'POST',
    body: JSON.stringify(investorData),
  });
};

export const apiUpdateInvestor = async (id, investorData) => {
  return apiFetch(`/investors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(investorData),
  });
};

export const apiDeleteInvestor = async (id) => {
  return apiFetch(`/investors/${id}`, {
    method: 'DELETE',
  });
};

// ============ TRANSACTIONS API ============

export const apiGetTransactions = async (investorId) => {
  return apiFetch(`/transactions?investor_id=${investorId}`);
};

export const apiCreateTransaction = async (transactionData) => {
  return apiFetch('/transactions', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  });
};

export const apiUpdateTransaction = async (id, transactionData) => {
  return apiFetch(`/transactions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(transactionData),
  });
};

export const apiDeleteTransaction = async (id) => {
  return apiFetch(`/transactions/${id}`, {
    method: 'DELETE',
  });
};

// ============ DATA TRANSFORMATION ============
// Transform backend data format to frontend format

export const transformCompanyFromAPI = (company, investors = []) => {
  return {
    id: company.id.toString(),
    name: company.name,
    address: company.description?.split('\n')[0] || '',
    phone: company.description?.match(/Phone: ([^\n]+)/)?.[1] || '',
    email: company.description?.match(/Email: ([^\n]+)/)?.[1] || '',
    defaultRate: parseFloat(company.default_interest_rate),
    investors: investors.map(transformInvestorFromAPI),
  };
};

export const transformInvestorFromAPI = (investor) => {
  // Parse date to DD-MMM-YYYY format
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = String(date.getDate()).padStart(2, '0');
    return `${day}-${months[date.getMonth()]}-${date.getFullYear()}`;
  };
  
  return {
    id: investor.id.toString(),
    name: investor.name,
    address: investor.address || '',
    email: investor.email || '',
    phone: investor.phone || '',
    initialInvestment: parseFloat(investor.initial_investment),
    currentBalance: parseFloat(investor.current_balance),
    interestRate: parseFloat(investor.interest_rate),
    startDate: formatDate(investor.investment_date),
    reinvesting: investor.notes?.includes('Reinvesting') || false,
    archived: investor.status === 'inactive',
    transactions: (investor.transactions || []).map(tx => ({
      id: tx.id,
      date: formatDate(tx.transaction_date),
      type: tx.transaction_type,
      amount: parseFloat(tx.amount),
      description: tx.description || '',
    })),
  };
};

export const transformInvestorToAPI = (investor, companyId) => {
  // Parse DD-MMM-YYYY to YYYY-MM-DD
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', 
                     Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (match) {
      const [, day, mon, year] = match;
      return `${year}-${months[mon]}-${day.padStart(2, '0')}`;
    }
    // Already YYYY-MM-DD
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    return null;
  };
  
  return {
    company_id: companyId,
    name: investor.name,
    address: investor.address || '',
    email: investor.email || '',
    phone: investor.phone || '',
    initial_investment: investor.initialInvestment,
    interest_rate: investor.interestRate,
    investment_date: parseDate(investor.startDate),
    notes: investor.reinvesting ? 'Reinvesting' : 'Interest paid out',
  };
};

export const transformTransactionToAPI = (transaction, investorId) => {
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', 
                     Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' };
    const match = dateStr.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
    if (match) {
      const [, day, mon, year] = match;
      return `${year}-${months[mon]}-${day.padStart(2, '0')}`;
    }
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;
    return null;
  };
  
  return {
    investor_id: investorId,
    transaction_date: parseDate(transaction.date),
    transaction_type: transaction.type,
    amount: transaction.amount,
    description: transaction.description || '',
  };
};

// ============ LOAD ALL DATA ============
// Loads companies with their investors and transactions

export const loadAllDataFromAPI = async () => {
  try {
    // Get all companies
    const companiesResponse = await apiGetCompanies();
    const companies = companiesResponse.data || [];
    
    // Get all investors
    const investorsResponse = await apiGetInvestors();
    const allInvestors = investorsResponse.data || [];
    
    // Group investors by company and transform
    const result = companies.map(company => {
      const companyInvestors = allInvestors.filter(inv => inv.company_id === company.id);
      return transformCompanyFromAPI(company, companyInvestors);
    });
    
    return result;
  } catch (error) {
    console.error('Error loading data from API:', error);
    throw error;
  }
};

// Check if API is available
export const checkAPIHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.ok;
  } catch {
    return false;
  }
};

