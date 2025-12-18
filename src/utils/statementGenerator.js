// Professional Statement Generator for Patel Capital System
// Supports multiple statement formats:
// - Trophy Point format (teal branding, unit-based)
// - Patel Capital Partners format (DEFAULT - blue branding, traditional)
// - Custom formats per company

import jsPDF from 'jspdf';
import 'jspdf-autotable';

/**
 * Parse date in DD-MMM-YYYY format (e.g., '23-Apr-2021')
 */
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

/**
 * Format date for PDF display (e.g., "23 Apr 2021")
 */
const formatDateForPDF = (dateStr, format = 'short') => {
  const date = parseDate(dateStr);
  const day = date.getDate();
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' });
  const monthLong = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear();
  
  if (format === 'long') {
    return `${day} ${monthLong} ${year}`;
  } else if (format === 'medium') {
    return `${day} ${monthShort} ${year}`;
  } else {
    // short format for tables
    return `${day} ${monthShort}`;
  }
};

/**
 * Calculate current balance for an investor
 */
export const calculateCurrentBalance = (investor) => {
  let balance = 0;
  investor.transactions.forEach(tx => {
    if (['initial', 'investment', 'bonus', 'adjustment'].includes(tx.type)) {
      balance += tx.amount;
    } else if (tx.type === 'interest-earned') {
      balance += tx.amount;
    } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type)) {
      balance -= tx.amount;
    }
  });
  return balance;
};

/**
 * Calculate total principal invested
 */
export const calculateTotalPrincipal = (investor) => {
  let principal = 0;
  investor.transactions.forEach(tx => {
    if (['initial', 'investment'].includes(tx.type)) {
      principal += tx.amount;
    } else if (tx.type === 'withdrawal') {
      principal -= tx.amount;
    }
  });
  return principal;
};

/**
 * Calculate total interest earned
 */
export const calculateTotalInterest = (investor) => {
  let interest = 0;
  investor.transactions.forEach(tx => {
    if (tx.type === 'interest-earned') {
      interest += tx.amount;
    }
  });
  return interest;
};

/**
 * Calculate interest for a specific period
 */
export const calculatePeriodInterest = (investor, startDate, endDate) => {
  let interest = 0;
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  investor.transactions.forEach(tx => {
    const txDate = parseDate(tx.date);
    if (tx.type === 'interest-earned' && txDate >= start && txDate <= end) {
      interest += tx.amount;
    }
  });
  
  return interest;
};

/**
 * Calculate interest earned in a specific year
 */
export const calculateYearlyInterest = (investor, year) => {
  let interest = 0;
  
  investor.transactions.forEach(tx => {
    const txDate = parseDate(tx.date);
    if (tx.type === 'interest-earned' && txDate.getFullYear() === year) {
      interest += tx.amount;
    }
  });
  
  return interest;
};

/**
 * Get activity summary for a period
 */
export const getActivitySummary = (investor, startDate, endDate) => {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  
  let openingBalance = 0;
  let investments = 0;
  let interestEarned = 0;
  let withdrawals = 0;
  
  investor.transactions.forEach(tx => {
    const txDate = parseDate(tx.date);
    
    if (txDate < start) {
      // Calculate opening balance
      if (['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type)) {
        openingBalance += tx.amount;
      } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type)) {
        openingBalance -= tx.amount;
      }
    } else if (txDate >= start && txDate <= end) {
      // Sum activity for period
      if (['investment'].includes(tx.type)) {
        investments += tx.amount;
      } else if (tx.type === 'interest-earned') {
        interestEarned += tx.amount;
      } else if (['interest-paid', 'withdrawal'].includes(tx.type)) {
        withdrawals += tx.amount;
      }
    }
  });
  
  const endingBalance = openingBalance + investments + interestEarned - withdrawals;
  
  return {
    openingBalance,
    investments,
    interestEarned,
    withdrawals,
    endingBalance
  };
};

/**
 * Generate Trophy Point style PDF statement
 */
export const generateTrophyPointStatement = (investor, company, startDate = null, endDate = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Use provided dates or default to all-time
  const periodStart = startDate || investor.startDate;
  const periodEnd = endDate || investor.transactions[investor.transactions.length - 1].date;
  
  const summary = getActivitySummary(investor, periodStart, periodEnd);
  const portfolioValue = calculateCurrentBalance(investor);
  const totalPrincipal = calculateTotalPrincipal(investor);
  
  // Load logo if available (Trophy Point statue)
  // For now, we'll add text header
  
  // Company Logo/Name Area
  doc.setFontSize(28);
  doc.setTextColor(87, 131, 131); // Teal color
  doc.setFont('helvetica', 'bold');
  doc.text(company.name || 'TROPHY POINT', pageWidth / 2, 25, { align: 'center' });
  
  // Separator line
  doc.setDrawColor(87, 131, 131);
  doc.setLineWidth(0.5);
  doc.line(20, 30, pageWidth - 20, 30);
  
  // Client Info Section
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENT INFO', 20, 45);
  
  doc.setFont('helvetica', 'normal');
  doc.text(investor.name || 'N/A', 20, 51);
  if (investor.address) {
    const addressLines = investor.address.split(',');
    let yPos = 57;
    addressLines.forEach(line => {
      doc.text(line.trim(), 20, yPos);
      yPos += 6;
    });
  }
  
  // Period Info (right aligned)
  doc.setFont('helvetica', 'normal');
  doc.text('This is your investment portfolio statement from', pageWidth - 20, 45, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.text(`${formatDateForPDF(periodStart, 'long')} through ${formatDateForPDF(periodEnd, 'long')}.`, pageWidth - 20, 51, { align: 'right' });
  
  // Portfolio Value Box
  doc.setFillColor(160, 186, 186); // Light teal
  doc.rect(20, 75, pageWidth - 40, 20, 'F');
  
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PORTFOLIO VALUE', 25, 85);
  doc.text(`$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 25, 85, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`as of ${formatDateForPDF(periodEnd, 'long')}`, 25, 91);
  doc.text(`Total Principal Invested $${totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, pageWidth - 25, 91, { align: 'right' });
  
  // Account Summary Table
  doc.setTextColor(0, 0, 0);
  doc.autoTable({
    startY: 100,
    head: [['Name', 'Investment', '# of Units', '$/Unit', 'Value']],
    body: [[
      `${investor.name} (${investor.interestRate}%)`,
      `$${totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      '$1.00',
      `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    ]],
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    theme: 'plain',
    margin: { left: 20, right: 20 }
  });
  
  // Activity Summary Box
  let currentY = doc.lastAutoTable.finalY + 10;
  doc.setFillColor(160, 186, 186);
  doc.rect(20, currentY, pageWidth - 40, 8, 'F');
  
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ACTIVITY SUMMARY', 25, currentY + 6);
  
  // Activity Summary Table
  currentY += 10;
  doc.autoTable({
    startY: currentY,
    head: [['', 'This Period ($)', 'This Year ($)', 'All Time ($)']],
    body: [
      ['Opening Balance', 
       summary.openingBalance > 0 ? `$${summary.openingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
       '-', '-'
      ],
      ['Investments',
       summary.investments > 0 ? `$${summary.investments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
       `$${summary.investments.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
       `$${totalPrincipal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ],
      ['Interest Earned',
       summary.interestEarned > 0 ? `$${summary.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-',
       `$${summary.interestEarned.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
       `$${calculateTotalInterest(investor).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ],
      ['Withdrawals*',
       summary.withdrawals > 0 ? `($${summary.withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '-',
       summary.withdrawals > 0 ? `($${summary.withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '-',
       summary.withdrawals > 0 ? `($${summary.withdrawals.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : '-'
      ],
      [{ content: 'Ending Balance', styles: { fontStyle: 'bold' } },
       { content: `$${summary.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { fontStyle: 'bold' } },
       { content: `$${summary.endingBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { fontStyle: 'bold' } },
       { content: `$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, styles: { fontStyle: 'bold' } }
      ]
    ],
    headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9 },
    theme: 'plain',
    margin: { left: 20, right: 20 }
  });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text('* includes redemption and interest paid/payable', 25, doc.lastAutoTable.finalY + 5);
  
  // Transaction Details - New Page (Patel Capital Format)
  doc.addPage();
  
  // Header on new page
  doc.setFontSize(20);
  doc.setTextColor(87, 131, 131);
  doc.setFont('times', 'bold');
  doc.text(company.name || 'TROPHY POINT', pageWidth / 2, 20, { align: 'center' });
  doc.setDrawColor(87, 131, 131);
  doc.line(20, 25, pageWidth - 20, 25);
  
  // Transaction History Header
  doc.setFontSize(13);
  doc.setTextColor(87, 131, 131);
  doc.setFont('times', 'bold');
  doc.text('TRANSACTION HISTORY', 20, 38);
  
  // Period info
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.setFont('times', 'italic');
  doc.text(`${investor.name} - Interest Rate: ${investor.interestRate}%`, 20, 44);
  doc.text(`Period: ${formatDateForPDF(periodStart, 'medium')} - ${formatDateForPDF(periodEnd, 'medium')}`, 20, 49);
  
  // Filter transactions for the period
  const periodTransactions = investor.transactions.filter(tx => {
    const txDate = parseDate(tx.date);
    return txDate >= parseDate(periodStart) && txDate <= parseDate(periodEnd);
  });
  
  // Build transaction table data - Patel Capital 4-column format
  const transactionRows = [];
  let runningBalance = 0;
  
  // Calculate opening balance
  investor.transactions.forEach(tx => {
    const txDate = parseDate(tx.date);
    if (txDate < parseDate(periodStart)) {
      if (['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type)) {
        runningBalance += tx.amount;
      } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type)) {
        runningBalance -= tx.amount;
      }
    }
  });
  
  periodTransactions.forEach(tx => {
    const dateStr = formatDateForPDF(tx.date, 'medium');
    
    let credits = '';
    let debits = '';
    
    if (['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type) && tx.amount > 0) {
      credits = `$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      runningBalance += tx.amount;
    } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || (tx.type === 'adjustment' && tx.amount < 0)) {
      debits = `$${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      runningBalance -= Math.abs(tx.amount);
    }
    
    const balanceStr = tx.type === 'rate-change' ? '-' : `$${runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    transactionRows.push([
      dateStr,
      tx.description || '',
      credits,
      debits,
      balanceStr
    ]);
  });
  
  // Reverse to show most recent transactions first (descending order)
  transactionRows.reverse();
  
  doc.autoTable({
    startY: 54,
    head: [['Date', 'Description', 'Credits', 'Debits', 'Balance']],
    body: transactionRows,
    headStyles: { 
      fillColor: [87, 131, 131],  // Trophy Point teal
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      font: 'times'
    },
    bodyStyles: { 
      fontSize: 8.5,
      font: 'times',
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left', valign: 'bottom' },
      1: { cellWidth: 80, halign: 'left', valign: 'bottom', cellPadding: { left: 2, right: 2 }, overflow: 'linebreak' },
      2: { cellWidth: 22, halign: 'right', valign: 'bottom' },
      3: { cellWidth: 20, halign: 'right', valign: 'bottom' },
      4: { cellWidth: 28, halign: 'right', valign: 'bottom' }
    },
    didParseCell: function(data) {
      // Right-align header cells for Credits, Debits, Balance columns
      if (data.section === 'head' && (data.column.index === 2 || data.column.index === 3 || data.column.index === 4)) {
        data.cell.styles.halign = 'right';
      }
    },
    alternateRowStyles: { 
      fillColor: [248, 250, 252] 
    },
    theme: 'striped',
    margin: { left: 20, right: 20 },
    tableWidth: 'wrap'
  });
  
  // Return the PDF
  return doc;
};

/**
 * Helper function to draw text-based logo fallback
 */
const addTextLogo = (doc, pageWidth) => {
  doc.setFontSize(18);
  doc.setTextColor(34, 97, 163);
  doc.setFont('helvetica', 'bold');
  
  const pcpWidth = doc.getTextWidth('PCP');
  const separatorWidth = doc.getTextWidth(' | ');
  doc.setFontSize(12);
  const capitalWidth = doc.getTextWidth('CAPITAL PARTNERS');
  
  const totalLogoWidth = pcpWidth + separatorWidth + capitalWidth + 5;
  const startX = (pageWidth - totalLogoWidth) / 2;
  
  doc.setFontSize(18);
  doc.text('PCP', startX, 15);
  doc.setTextColor(100, 100, 100);
  doc.text(' | ', startX + pcpWidth, 15);
  doc.setTextColor(34, 97, 163);
  doc.setFontSize(12);
  doc.text('CAPITAL PARTNERS', startX + pcpWidth + separatorWidth, 15);
};

/**
 * Generate Patel Capital Partners format statement (DEFAULT FORMAT)
 * Traditional blue branding, simple transaction list
 */
export const generatePatelCapitalStatement = async (investor, company, startDate = null, endDate = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Use provided dates or default to all-time
  const periodStart = startDate || investor.startDate;
  const periodEnd = endDate || investor.transactions[investor.transactions.length - 1].date;
  
  const portfolioValue = calculateCurrentBalance(investor);
  const totalInterest = calculateTotalInterest(investor);
  const interest2025 = calculateYearlyInterest(investor, 2025);
  
  // Add logo image on top center
  try {
    // Load the logo image
    const logoUrl = `${window.location.origin}/patel-logo.png`;
    const response = await fetch(logoUrl);
    const blob = await response.blob();
    
    const base64data = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    
    // Add logo centered at the top
    const logoWidth = 60;
    const logoHeight = 18;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(base64data, 'PNG', logoX, 8, logoWidth, logoHeight);
  } catch (error) {
    console.log('Logo image not found, using text logo:', error);
    // Fallback to text logo if image not available
    addTextLogo(doc, pageWidth);
  }
  
  // Tagline only (removed company name)
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.setFont('times', 'italic');
  doc.text('Safety. Stability. Growth.', pageWidth / 2, 30, { align: 'center' });
  
  // Separator line
  doc.setDrawColor(25, 55, 109);
  doc.setLineWidth(0.5);
  doc.line(20, 35, pageWidth - 20, 35);
  
  // Investor Information Box
  doc.setFillColor(245, 248, 252); // Very light blue-grey
  doc.rect(20, 42, pageWidth - 40, 35, 'F');
  
  doc.setFontSize(10);
  doc.setFont('times', 'bold');
  doc.text('Account Holder:', 25, 49);
  doc.setFont('times', 'normal');
  doc.text(investor.name || 'N/A', 25, 55);
  if (investor.address) {
    doc.setFontSize(9);
    const addressLines = investor.address.split(',');
    let yPos = 60;
    addressLines.forEach(line => {
      doc.text(line.trim(), 25, yPos);
      yPos += 4;
    });
  }
  
  // Contact info (left side of box, below address)
  if (investor.email || investor.phone) {
    let contactYPos = 60 + (investor.address ? investor.address.split(',').length * 4 : 0);
    doc.setFontSize(9);
    if (investor.email) {
      doc.text(investor.email, 25, contactYPos);
      contactYPos += 4;
    }
    if (investor.phone) {
      doc.text(investor.phone, 25, contactYPos);
    }
  }
  
  // Account details (right side of box)
  doc.setFontSize(9);
  doc.setFont('times', 'bold');
  doc.text('Statement Date:', pageWidth - 85, 49);
  doc.text('Date of Investment:', pageWidth - 85, 56);
  doc.text('Interest Rate:', pageWidth - 85, 63);
  doc.text('Account Type:', pageWidth - 85, 70);
  
  doc.setFont('times', 'normal');
  const today = new Date();
  const day = today.getDate();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[today.getMonth()];
  const year = today.getFullYear();
  const todayFormatted = `${day} ${month} ${year}`;
  doc.text(todayFormatted, pageWidth - 25, 49, { align: 'right' });
  doc.text(formatDateForPDF(investor.startDate, 'medium'), pageWidth - 25, 56, { align: 'right' });
  doc.text(`${investor.interestRate}%`, pageWidth - 25, 63, { align: 'right' });
  doc.text(investor.reinvesting ? 'Reinvesting' : 'Interest Paid Out', pageWidth - 25, 70, { align: 'right' });
  
  // Account Summary
  doc.setFontSize(13);
  doc.setTextColor(30, 60, 110);
  doc.setFont('times', 'bold');
  doc.text('ACCOUNT SUMMARY', 20, 88);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  
  // Summary boxes with refined colors
  const boxY = 93;
  const boxHeight = 20;
  const boxWidth = (pageWidth - 40 - 10) / 3; // 40 for left/right margins, 10 for gaps between boxes
  
  // Current Balance Box - Dark Navy
  doc.setFillColor(31, 58, 96);
  doc.rect(20, boxY, boxWidth, boxHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Current Balance', 22, boxY + 6);
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text(`$${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 22, boxY + 16);
  
  // Lifetime Interest Earned Box - Medium Blue
  doc.setFillColor(52, 85, 135);
  doc.rect(20 + boxWidth + 5, boxY, boxWidth, boxHeight, 'F');
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Lifetime Interest Earned', 22 + boxWidth + 5, boxY + 6);
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text(`$${totalInterest.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 22 + boxWidth + 5, boxY + 16);
  
  // Interest Earned in 2025 Box - Lighter Blue
  doc.setFillColor(75, 115, 170);
  doc.rect(20 + (boxWidth + 5) * 2, boxY, boxWidth, boxHeight, 'F');
  doc.setFont('times', 'normal');
  doc.setFontSize(9);
  doc.text('Interest Earned 2025', 22 + (boxWidth + 5) * 2, boxY + 6);
  doc.setFont('times', 'bold');
  doc.setFontSize(15);
  doc.text(`$${interest2025.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 22 + (boxWidth + 5) * 2, boxY + 16);
  
  // Transaction History
  doc.setFontSize(13);
  doc.setTextColor(30, 60, 110);
  doc.setFont('times', 'bold');
  doc.text('TRANSACTION HISTORY', 20, 125);
  
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.setFont('times', 'italic');
  doc.text(`Period: ${formatDateForPDF(periodStart, 'medium')} - ${formatDateForPDF(periodEnd, 'medium')}`, 20, 131);
  
  // Filter transactions for period
  const periodTransactions = investor.transactions.filter(tx => {
    const txDate = parseDate(tx.date);
    return txDate >= parseDate(periodStart) && txDate <= parseDate(periodEnd);
  });
  
  // Build transaction table
  const transactionRows = [];
  let runningBalance = 0;
  
  // Calculate opening balance
  investor.transactions.forEach(tx => {
    const txDate = parseDate(tx.date);
    if (txDate < parseDate(periodStart)) {
      if (['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type)) {
        runningBalance += tx.amount;
      } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type)) {
        runningBalance -= tx.amount;
      }
    }
  });
  
  periodTransactions.forEach(tx => {
    const dateStr = formatDateForPDF(tx.date, 'medium');
    
    let credits = '';
    let debits = '';
    
    if (['initial', 'investment', 'interest-earned', 'bonus', 'adjustment'].includes(tx.type) && tx.amount > 0) {
      credits = `$${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      runningBalance += tx.amount;
    } else if (['interest-paid', 'withdrawal', 'fee'].includes(tx.type) || (tx.type === 'adjustment' && tx.amount < 0)) {
      debits = `$${Math.abs(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      runningBalance -= Math.abs(tx.amount);
    }
    
    const balanceStr = tx.type === 'rate-change' ? '-' : `$${runningBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    transactionRows.push([
      dateStr,
      tx.description,
      credits,
      debits,
      balanceStr
    ]);
  });
  
  // Reverse to show most recent transactions first (descending order)
  transactionRows.reverse();
  
  doc.autoTable({
    startY: 135,
    head: [['Date', 'Description', 'Credits', 'Debits', 'Balance']],
    body: transactionRows,
    headStyles: { 
      fillColor: [31, 58, 96],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      font: 'times'
    },
    bodyStyles: { 
      fontSize: 8.5,
      font: 'times',
      cellPadding: 2,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'left', valign: 'bottom' },
      1: { cellWidth: 80, halign: 'left', valign: 'bottom', cellPadding: { left: 2, right: 2 }, overflow: 'linebreak' },
      2: { cellWidth: 20, halign: 'right', valign: 'bottom' },
      3: { cellWidth: 18, halign: 'right', valign: 'bottom' },
      4: { cellWidth: 28, halign: 'right', valign: 'bottom' }
    },
    didParseCell: function(data) {
      // Right-align header cells for Credits, Debits, Balance columns
      if (data.section === 'head' && (data.column.index === 2 || data.column.index === 3 || data.column.index === 4)) {
        data.cell.styles.halign = 'right';
      }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'striped',
    margin: { left: 20, right: 20 },
    tableWidth: 'wrap'
  });
  
  // Footer with company and Samir's details
  const finalY = doc.lastAutoTable.finalY + 10;
  doc.setDrawColor(31, 58, 96);
  doc.setLineWidth(0.3);
  doc.line(20, finalY, pageWidth - 20, finalY);
  
  // Company information (left side)
  doc.setFontSize(9);
  doc.setTextColor(30, 60, 110);
  doc.setFont('times', 'bold');
  doc.text(company.name || 'PATEL CAPITAL PARTNERS', 20, finalY + 6);
  doc.setFont('times', 'normal');
  doc.setTextColor(70, 70, 70);
  doc.setFontSize(8);
  if (company.address) {
    doc.text(company.address, 20, finalY + 11);
  }
  if (company.phone) {
    doc.text(`Tel: ${company.phone}`, 20, finalY + 16);
  }
  if (company.email) {
    doc.text(`Email: ${company.email}`, 20, finalY + 21);
  }
  if (company.website) {
    doc.text(`Web: ${company.website}`, 20, finalY + 26);
  }
  
  // Samir's contact details (right side)
  doc.setFont('times', 'bold');
  doc.setTextColor(30, 60, 110);
  doc.setFontSize(9);
  doc.text('For questions, contact:', pageWidth - 20, finalY + 6, { align: 'right' });
  doc.setFontSize(10);
  doc.text('Samir Patel', pageWidth - 20, finalY + 12, { align: 'right' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text('samir@patel-capital.net', pageWidth - 20, finalY + 17, { align: 'right' });
  doc.text('(404) 723-8410', pageWidth - 20, finalY + 22, { align: 'right' });
  
  return doc;
};

/**
 * Determine which format to use based on company
 */
const getStatementFormat = (company) => {
  const companyName = company.name?.toUpperCase() || '';
  
  // Trophy Point uses special format
  if (companyName.includes('TROPHY POINT')) {
    return 'trophy-point';
  }
  
  // Everything else uses Patel Capital Partners format (DEFAULT)
  return 'patel-capital';
};

/**
 * Generate statement with appropriate format
 */
export const generateStatement = async (investor, company, startDate = null, endDate = null) => {
  const format = getStatementFormat(company);
  
  if (format === 'trophy-point') {
    return generateTrophyPointStatement(investor, company, startDate, endDate);
  } else {
    // Default to Patel Capital Partners format
    return await generatePatelCapitalStatement(investor, company, startDate, endDate);
  }
};

/**
 * Download statement as PDF (auto-detects format)
 */
export const downloadStatement = async (investor, company, startDate = null, endDate = null) => {
  const doc = await generateStatement(investor, company, startDate, endDate);
  const fileName = `${company.name}_${investor.name}_Statement_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Print statement (auto-detects format)
 */
export const printStatement = async (investor, company, startDate = null, endDate = null) => {
  const doc = await generateStatement(investor, company, startDate, endDate);
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

