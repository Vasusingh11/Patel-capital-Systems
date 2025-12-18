import * as XLSX from 'xlsx';

/**
 * Export investor statement to Excel with formulas
 * @param {Object} investor - The investor data
 * @param {Object} company - The company data
 * @param {Function} calculateCurrentBalance - Function to calculate current balance
 */
export const exportToExcel = (investor, company, calculateCurrentBalance) => {
  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Prepare header data
  const headerData = [
    ['PATEL CAPITAL PARTNERS'],
    ['Investment Management System'],
    ['6608 Brynhurst Dr., Tucker, GA, 30084'],
    ['Phone: 404-723-8410 | Email: samir@patel-capital.net'],
    ['www.patel-capital.net'],
    ['Safety. Stability. Growth.'],
    [''],
    ['INVESTOR STATEMENT'],
    [''],
    ['Investor Name:', investor.name],
    ['Address:', investor.address],
    ['Email:', investor.email],
    ['Phone:', investor.phone || 'N/A'],
    [''],
    ['Account Information:'],
    ['Initial Investment:', investor.initialInvestment],
    ['Interest Rate:', `${investor.interestRate}%`],
    ['Start Date:', investor.startDate],
    ['Reinvesting:', investor.reinvesting ? 'Yes' : 'No'],
    ['Current Balance:', calculateCurrentBalance(investor)],
    [''],
    ['']
  ];
  
  // Transaction header
  const transactionHeader = [
    ['Date', 'Description', 'Credits', 'Debits', 'Balance', 'Calculation']
  ];
  
  // Prepare transaction data with formulas
  const transactionData = [];
  const startRow = headerData.length + transactionHeader.length + 1; // Excel is 1-indexed
  
  investor.transactions.forEach((tx, idx) => {
    const rowNum = startRow + idx;
    let credits = '';
    let debits = '';
    let calculation = '';
    
    // Determine credits and debits
    if (['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type) || 
        (tx.type === 'adjustment' && tx.amount > 0)) {
      credits = tx.amount;
    } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || 
               (tx.type === 'adjustment' && tx.amount < 0)) {
      debits = Math.abs(tx.amount);
    } else if (tx.type === 'rate-change') {
      // Rate change transactions don't affect balance
      credits = '';
      debits = '';
    }
    
    // Create balance formula (sum of all credits minus sum of all debits up to this row)
    let balanceFormula;
    if (tx.type === 'rate-change') {
      // For rate changes, use previous balance
      balanceFormula = idx > 0 ? { f: `E${rowNum - 1}` } : 0;
    } else {
      if (idx === 0) {
        // First row: just use credits or debits
        balanceFormula = credits ? { f: `C${rowNum}` } : { f: `-D${rowNum}` };
      } else {
        // Subsequent rows: previous balance + credits - debits
        balanceFormula = { f: `E${rowNum - 1}+IF(ISBLANK(C${rowNum}),0,C${rowNum})-IF(ISBLANK(D${rowNum}),0,D${rowNum})` };
      }
    }
    
    // Add calculation explanation
    if (tx.type === 'interest-earned' && tx.description.includes('days')) {
      const match = tx.description.match(/(\d+) days/);
      if (match) {
        const days = match[1];
        const rate = investor.interestRate / 100;
        calculation = `=(E${rowNum - 1}*${rate}*${days})/365`;
      }
    }
    
    transactionData.push([
      tx.date,
      tx.description,
      credits === '' ? '' : credits,
      debits === '' ? '' : debits,
      balanceFormula,
      calculation
    ]);
  });
  
  // Combine all data
  const allData = [
    ...headerData,
    ...transactionHeader,
    ...transactionData
  ];
  
  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allData);
  
  // Set column widths
  ws['!cols'] = [
    { wch: 12 },  // Date
    { wch: 60 },  // Description
    { wch: 15 },  // Credits
    { wch: 15 },  // Debits
    { wch: 15 },  // Balance
    { wch: 30 }   // Calculation
  ];
  
  // Style the header rows (basic formatting)
  const range = XLSX.utils.decode_range(ws['!ref']);
  
  // Format currency columns (Credits, Debits, Balance)
  for (let R = startRow - 1; R <= range.e.r; ++R) {
    for (let C = 2; C <= 4; ++C) { // Columns C, D, E (Credits, Debits, Balance)
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      if (ws[cellAddress] && ws[cellAddress].v !== '') {
        if (!ws[cellAddress].z) ws[cellAddress].z = '$#,##0.00';
      }
    }
  }
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Statement');
  
  // Generate file name
  const fileName = `${investor.name.replace(/[^a-z0-9]/gi, '_')}_Statement_${new Date().toISOString().split('T')[0]}.xlsx`;
  
  // Write file
  XLSX.writeFile(wb, fileName);
};

/**
 * Export all company data to Excel with multiple sheets
 * @param {Array} companies - All companies data
 * @param {Function} calculateCurrentBalance - Function to calculate current balance
 */
export const exportAllToExcel = (companies, calculateCurrentBalance) => {
  const wb = XLSX.utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['PATEL CAPITAL PARTNERS'],
    ['Complete Portfolio Summary'],
    [''],
    ['Company', 'Investors', 'Total Investment', 'Current Balance'],
    []
  ];
  
  companies.forEach(company => {
    const totalInvestment = company.investors.reduce((sum, inv) => {
      let invested = 0;
      inv.transactions.forEach(tx => {
        if (['initial', 'investment'].includes(tx.type)) {
          invested += tx.amount;
        } else if (tx.type === 'withdrawal') {
          invested -= tx.amount;
        }
      });
      return sum + invested;
    }, 0);
    
    const totalBalance = company.investors.reduce((sum, inv) => 
      sum + calculateCurrentBalance(inv), 0
    );
    
    summaryData.push([
      company.name,
      company.investors.length,
      totalInvestment,
      totalBalance
    ]);
  });
  
  const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
  summaryWs['!cols'] = [{ wch: 30 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
  
  // Add a sheet for each company
  companies.forEach(company => {
    company.investors.forEach((investor, idx) => {
      const sheetName = `${investor.name.substring(0, 25)}_${idx + 1}`.replace(/[^a-z0-9]/gi, '_');
      
      const headerData = [
        [company.name],
        [`Investor: ${investor.name}`],
        [`Rate: ${investor.interestRate}%`],
        [''],
        ['Date', 'Description', 'Credits', 'Debits', 'Balance']
      ];
      
      const transactionData = [];
      const startRow = headerData.length + 1;
      
      investor.transactions.forEach((tx, txIdx) => {
        const rowNum = startRow + txIdx;
        let credits = '';
        let debits = '';
        
        if (['initial', 'investment', 'interest-earned', 'bonus'].includes(tx.type) || 
            (tx.type === 'adjustment' && tx.amount > 0)) {
          credits = tx.amount;
        } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || 
                   (tx.type === 'adjustment' && tx.amount < 0)) {
          debits = Math.abs(tx.amount);
        }
        
        let balanceFormula;
        if (tx.type === 'rate-change') {
          balanceFormula = txIdx > 0 ? { f: `E${rowNum - 1}` } : 0;
        } else {
          if (txIdx === 0) {
            balanceFormula = credits ? { f: `C${rowNum}` } : { f: `-D${rowNum}` };
          } else {
            balanceFormula = { f: `E${rowNum - 1}+IF(ISBLANK(C${rowNum}),0,C${rowNum})-IF(ISBLANK(D${rowNum}),0,D${rowNum})` };
          }
        }
        
        transactionData.push([
          tx.date,
          tx.description,
          credits === '' ? '' : credits,
          debits === '' ? '' : debits,
          balanceFormula
        ]);
      });
      
      const allData = [...headerData, ...transactionData];
      const ws = XLSX.utils.aoa_to_sheet(allData);
      ws['!cols'] = [
        { wch: 12 },
        { wch: 60 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 }
      ];
      
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    });
  });
  
  const fileName = `Patel_Capital_Complete_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

