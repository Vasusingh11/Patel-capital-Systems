// Calculation utilities for Patel Capital System

// Helper to parse DD-MMM-YYYY format
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

export const calculateCurrentBalance = (investor) => {
  let balance = 0;
  investor.transactions.forEach(tx => {
    if (['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type)) {
      balance += tx.amount;
    } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type)) {
      balance -= tx.amount;
    } else if (tx.type === 'adjustment') {
      balance += tx.amount;
    }
    // rate-change doesn't affect balance
  });
  return balance;
};

export const calculateTotalInterest = (investor) => {
  return investor.transactions
    .filter(tx => tx.type === 'interest-earned' || tx.type === 'bonus')
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const calculateYearlyInterest = (investor, year) => {
  return investor.transactions
    .filter(tx => {
      if (tx.type !== 'interest-earned' && tx.type !== 'bonus') return false;
      const txDate = parseDate(tx.date);
      return txDate.getFullYear() === year;
    })
    .reduce((sum, tx) => sum + tx.amount, 0);
};

export const calculateProratedInterest = (principal, annualRate, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Add 1 to include the start date in the calculation (interest starts same day)
  const daysDiff = Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1;
  return (principal * (annualRate / 100) * daysDiff) / 365;
};

export const getQuarterDates = (quarter, year) => {
  const dates = {
    'Q1': { start: `${year}-01-01`, end: `${year}-03-31` },
    'Q2': { start: `${year}-04-01`, end: `${year}-06-30` },
    'Q3': { start: `${year}-07-01`, end: `${year}-09-30` },
    'Q4': { start: `${year}-10-01`, end: `${year}-12-31` }
  };
  return dates[quarter];
};

export const calculateQuarterlyProratedInterest = (investor, quarterStart, quarterEnd) => {
  // Get all transactions up to quarter end, sorted by date
  const relevantTxs = investor.transactions
    .filter(tx => parseDate(tx.date) <= new Date(quarterEnd))
    .sort((a, b) => parseDate(a.date) - parseDate(b.date));
  
  let totalInterest = 0;
  let currentBalance = 0;
  let currentRate = investor.interestRate;
  let periodStart = new Date(quarterStart);
  
  // Process each transaction in the quarter
  for (let tx of relevantTxs) {
    const txDate = parseDate(tx.date);
    
    // If transaction is before quarter, just update balance and continue
    if (txDate < new Date(quarterStart)) {
      if (tx.type === 'initial' || tx.type === 'investment') {
        currentBalance += tx.amount;
      } else if (tx.type === 'interest-earned') {
        currentBalance += tx.amount;
      } else if (tx.type === 'interest-paid') {
        currentBalance -= tx.amount;
      } else if (tx.type === 'bonus') {
        currentBalance += tx.amount;
      } else if (tx.type === 'withdrawal' || tx.type === 'fee') {
        currentBalance -= tx.amount;
      } else if (tx.type === 'adjustment') {
        currentBalance += tx.amount;
      } else if (tx.type === 'rate-change') {
        currentRate = tx.metadata?.newRate || currentRate;
      }
      continue;
    }
    
    // If transaction is in quarter, calculate interest up to this point
    if (txDate >= new Date(quarterStart) && txDate <= new Date(quarterEnd)) {
      // Calculate interest from period start to transaction date
      if (currentBalance > 0 && periodStart < txDate) {
        const periodInterest = calculateProratedInterest(currentBalance, currentRate, periodStart, txDate);
        totalInterest += periodInterest;
      }
      
      // Update balance and rate based on transaction
      if (tx.type === 'initial' || tx.type === 'investment') {
        currentBalance += tx.amount;
      } else if (tx.type === 'bonus') {
        currentBalance += tx.amount;
      } else if (tx.type === 'withdrawal' || tx.type === 'fee') {
        currentBalance -= tx.amount;
      } else if (tx.type === 'adjustment') {
        currentBalance += tx.amount;
      } else if (tx.type === 'rate-change') {
        currentRate = tx.metadata?.newRate || currentRate;
      }
      
      periodStart = txDate;
    }
  }
  
  // Calculate interest for remaining period in quarter
  const quarterEndDate = new Date(quarterEnd);
  if (currentBalance > 0 && periodStart < quarterEndDate) {
    const remainingInterest = calculateProratedInterest(currentBalance, currentRate, periodStart, quarterEndDate);
    totalInterest += remainingInterest;
  }
  
  return Math.round(totalInterest * 100) / 100;
};
