// Trophy Point Company Data
// Updated: October 6, 2025
// Complete transaction history with exact calculations
// Company: Trophy Point
// Address: 305 Trilith Pkwy Ste 300 #1619, Fayetteville, GA 30214
//
// CALCULATION NOTES:
// - All interest calculations use actual/365 day count
// - Monthly interest accruals for Trophy Point
// - Quarterly disbursements
// - Rate changes are marked in transaction descriptions

export const getTrophyPointData = () => ({
  id: 'trophy-point',
  name: 'TROPHY POINT',
  address: '305 Trilith Pkwy Ste 300 #1619, Fayetteville, GA 30214',
  phone: '',
  email: '',
  website: '',
  tagline: 'Building Generational Wealth',
  defaultRate: 12.00,
  investors: [
    // INVESTOR PC1: Patel Capital 1 (Patel Capital Partners LLC - 1)
    {
      id: 'pc1',
      name: 'Patel Capital 1',
      address: '6608 Brynhurst Drive, Tucker, GA 30084',
      email: 'samir@trophypointinvestment.com',
      phone: '(404) 723-8410',
      initialInvestment: 110405.38,
      currentBalance: 3542974.73,
      interestRate: 12.00,
      startDate: '01-Jan-2023',
      reinvesting: true,
      transactions: [
        // 2023 Transactions @ 12% (monthly interest, quarterly reinvestment)
        { date: '01-Jan-2023', type: 'initial', amount: 110405.38, description: 'Initial Investment' },
        { date: '12-Jan-2023', type: 'investment', amount: 85000.00, description: 'Additional Investment (effective Feb 1)' },
        { date: '31-Mar-2023', type: 'interest-earned', amount: 5012.15, description: 'Q1 2023 Interest (Jan-Mar) @ 12%' },
        { date: '31-Mar-2023', type: 'interest-earned', amount: 5012.15, description: 'Q1 2023 Interest Reinvested' },
        { date: '01-Apr-2023', type: 'investment', amount: 300000.00, description: 'Additional Investment Apr 1' },
        { date: '30-Jun-2023', type: 'interest-earned', amount: 15012.54, description: 'Q2 2023 Interest (Apr-Jun) @ 12%' },
        { date: '30-Jun-2023', type: 'interest-earned', amount: 15012.54, description: 'Q2 2023 Interest Reinvested' },
        { date: '01-Jul-2023', type: 'investment', amount: 1150000.00, description: 'Additional Investment Jul 1' },
        { date: '30-Sep-2023', type: 'interest-earned', amount: 49962.90, description: 'Q3 2023 Interest (Jul-Sep) @ 12%' },
        { date: '30-Sep-2023', type: 'interest-earned', amount: 49962.90, description: 'Q3 2023 Interest Reinvested' },
        { date: '01-Oct-2023', type: 'investment', amount: 500000.00, description: 'Additional Investment Oct 1' },
        { date: '01-Nov-2023', type: 'investment', amount: 300000.00, description: 'Additional Investment Nov 1' },
        { date: '01-Dec-2023', type: 'investment', amount: 115000.00, description: 'Additional Investment Dec 1' },
        { date: '31-Dec-2023', type: 'withdrawal', amount: 114736.45, description: 'Year-end withdrawal' },
        { date: '31-Dec-2023', type: 'interest-earned', amount: 73611.79, description: 'Q4 2023 Interest (Oct-Dec) @ 12%' },
        { date: '31-Dec-2023', type: 'interest-earned', amount: 73611.79, description: 'Q4 2023 Interest Reinvested' },
        
        // 2024 Transactions @ 12% (monthly interest, quarterly reinvestment)
        { date: '31-Mar-2024', type: 'interest-earned', amount: 69726.54, description: 'Q1 2024 Interest (Jan-Mar) @ 12%' },
        { date: '31-Mar-2024', type: 'interest-earned', amount: 69726.54, description: 'Q1 2024 Interest Reinvested' },
        { date: '01-Apr-2024', type: 'investment', amount: 125000.00, description: 'Additional Investment Apr 1' },
        { date: '01-May-2024', type: 'investment', amount: 250000.00, description: 'Additional Investment May 1' },
        { date: '30-Jun-2024', type: 'interest-earned', amount: 80568.32, description: 'Q2 2024 Interest (Apr-Jun) @ 12%' },
        { date: '30-Jun-2024', type: 'interest-earned', amount: 80568.32, description: 'Q2 2024 Interest Reinvested' },
        { date: '01-Jul-2024', type: 'investment', amount: 185000.00, description: 'Additional Investment Jul 1' },
        { date: '30-Sep-2024', type: 'interest-earned', amount: 91035.36, description: 'Q3 2024 Interest (Jul-Sep) @ 12%' },
        { date: '30-Sep-2024', type: 'interest-earned', amount: 91035.36, description: 'Q3 2024 Interest Reinvested' },
        { date: '01-Oct-2024', type: 'investment', amount: 123735.33, description: 'Additional Investment Oct 1' },
        { date: '31-Dec-2024', type: 'interest-earned', amount: 97478.49, description: 'Q4 2024 Interest (Oct-Dec) @ 12%' },
        { date: '31-Dec-2024', type: 'interest-earned', amount: 97478.49, description: 'Q4 2024 Interest Reinvested' },
        
        // 2025 Transactions @ 12% (monthly interest, quarterly reinvestment)
        { date: '31-Mar-2025', type: 'interest-earned', amount: 100187.79, description: 'Q1 2025 Interest (Jan-Mar) @ 12%' },
        { date: '31-Mar-2025', type: 'interest-earned', amount: 100187.79, description: 'Q1 2025 Interest Reinvested' },
        { date: '30-Jun-2025', type: 'interest-earned', amount: 103193.46, description: 'Q2 2025 Interest (Apr-Jun) @ 12%' },
        { date: '30-Jun-2025', type: 'interest-earned', amount: 103193.46, description: 'Q2 2025 Interest Reinvested' },
        { date: '30-Sep-2025', type: 'interest-earned', amount: 106289.24, description: 'Q3 2025 Interest (Jul-Sep) @ 12%' },
        { date: '30-Sep-2025', type: 'interest-earned', amount: 106289.24, description: 'Q3 2025 Interest Reinvested' }
      ]
    },
    
    // INVESTOR PC2: Patel Capital 2
    {
      id: 'pc2',
      name: 'Patel Capital 2',
      address: '6608 Brynhurst Drive, Tucker, GA 30084',
      email: 'pc2@patel-capital.net',
      phone: '',
      initialInvestment: 71871.55,
      currentBalance: 2367797.05,
      interestRate: 12.00,
      startDate: '17-Aug-2020',
      reinvesting: false,
      transactions: [
        // 2020 Transactions @ 15%
        { date: '17-Aug-2020', type: 'initial', amount: 0, description: 'Account opening @ 15%', metadata: { rate: 15.00 } },
        { date: '01-Sep-2020', type: 'investment', amount: 71871.55, description: 'Initial Investment Sep 1' },
        { date: '15-Sep-2020', type: 'withdrawal', amount: 53871.55, description: 'Redemption' },
        { date: '30-Sep-2020', type: 'interest-earned', amount: 443.84, description: 'Q3 2020 Prorated Interest @ 15%' },
        { date: '30-Sep-2020', type: 'interest-paid', amount: 443.84, description: 'Q3 2020 Interest Disbursement' },
        { date: '01-Dec-2020', type: 'investment', amount: 98000.00, description: 'Additional Investment Dec 1' },
        { date: '01-Dec-2020', type: 'investment', amount: 23000.00, description: 'Additional Investment Dec 1' },
        { date: '31-Dec-2020', type: 'interest-earned', amount: 682.88, description: 'Interest Earned - Q4 2020 Oct 1 - Dec 31 @ 15%' },
        { date: '31-Dec-2020', type: 'interest-earned', amount: 1233.70, description: 'Interest Earned - Q4 2020 Prorated (Dec 1 - Dec 31) 31 days @ 15%' },
        { date: '31-Dec-2020', type: 'interest-earned', amount: 288.36, description: 'Interest Earned - Q4 2020 Prorated (Dec 1 - Dec 31) 31 days @ 15%' },
        { date: '31-Dec-2020', type: 'interest-paid', amount: 2204.94, description: 'Q4 2020 Interest Disbursement' },
        
        // 2021 Transactions @ 15% to 12.5% (Apr 1)
        { date: '01-Jan-2021', type: 'investment', amount: 125000.00, description: 'Additional Investment Jan 1' },
        { date: '31-Mar-2021', type: 'interest-earned', amount: 9905.81, description: 'Q1 2021 Interest @ 3.75% quarterly' },
        { date: '31-Mar-2021', type: 'interest-paid', amount: 9905.81, description: 'Q1 2021 Interest Disbursement' },
        { date: '01-Apr-2021', type: 'rate-change', amount: 0, description: 'Interest rate changed from 15% to 12.5%', metadata: { oldRate: 15.00, newRate: 12.50 } },
        { date: '01-Apr-2021', type: 'investment', amount: 500000.00, description: 'Additional Investment Apr 1' },
        { date: '01-May-2021', type: 'investment', amount: 300000.00, description: 'Additional Investment May 1' },
        { date: '01-May-2021', type: 'investment', amount: 300000.00, description: 'Additional Investment May 1' },
        { date: '01-Jun-2021', type: 'investment', amount: 150000.00, description: 'Additional Investment Jun 1' },
        { date: '01-Jun-2021', type: 'investment', amount: 150000.00, description: 'Additional Investment Jun 1' },
        { date: '01-Jun-2021', type: 'investment', amount: 350000.00, description: 'Additional Investment Jun 1' },
        { date: '30-Jun-2021', type: 'interest-earned', amount: 35074.08, description: 'Q2 2021 Prorated Interest @ 12.5%' },
        { date: '30-Jun-2021', type: 'interest-paid', amount: 35074.08, description: 'Q2 2021 Interest Disbursement' },
        { date: '01-Jul-2021', type: 'investment', amount: 300000.00, description: 'Additional Investment Jul 1' },
        { date: '01-Jul-2021', type: 'investment', amount: 225000.00, description: 'Additional Investment Jul 1' },
        { date: '01-Aug-2021', type: 'investment', amount: 200000.00, description: 'Additional Investment Aug 1' },
        { date: '01-Aug-2021', type: 'investment', amount: 275000.00, description: 'Additional Investment Aug 1' },
        { date: '01-Aug-2021', type: 'investment', amount: 200000.00, description: 'Additional Investment Aug 1' },
        { date: '01-Sep-2021', type: 'investment', amount: 150000.00, description: 'Additional Investment Sep 1' },
        { date: '01-Sep-2021', type: 'investment', amount: 200000.00, description: 'Additional Investment Sep 1' },
        { date: '30-Sep-2021', type: 'interest-earned', amount: 90504.80, description: 'Q3 2021 Prorated Interest @ 12.5%' },
        { date: '30-Sep-2021', type: 'interest-paid', amount: 90504.80, description: 'Q3 2021 Interest Disbursement' },
        { date: '01-Oct-2021', type: 'investment', amount: 100000.00, description: 'Additional Investment Oct 1' },
        { date: '01-Oct-2021', type: 'investment', amount: 100000.00, description: 'Additional Investment Oct 1' },
        { date: '19-Oct-2021', type: 'withdrawal', amount: 200000.00, description: 'Redemption' },
        { date: '01-Nov-2021', type: 'investment', amount: 100000.00, description: 'Additional Investment Nov 1' },
        { date: '31-Dec-2021', type: 'withdrawal', amount: 3400000.00, description: 'Large Redemption' },
        { date: '31-Dec-2021', type: 'interest-earned', amount: 106472.60, description: 'Q4 2021 Prorated Interest @ 12.5%' },
        { date: '31-Dec-2021', type: 'interest-paid', amount: 106472.60, description: 'Q4 2021 Interest Disbursement' },
        
        // 2022-2024 Transactions @ 10% to 11% (Oct 2023) to 12% (Jul 2024)
        { date: '01-Jan-2022', type: 'rate-change', amount: 0, description: 'Interest rate changed from 12.5% to 10%', metadata: { oldRate: 12.50, newRate: 10.00 } },
        { date: '01-Jan-2022', type: 'investment', amount: 267815.63, description: 'Transfer Jan 1' },
        { date: '18-Feb-2022', type: 'withdrawal', amount: 30000.00, description: 'Redemption' },
        { date: '01-Mar-2022', type: 'investment', amount: 25000.00, description: 'Additional Investment Mar 1' },
        { date: '31-Mar-2022', type: 'interest-earned', amount: 6588.68, description: 'Q1 2022 Interest @ 2.5% quarterly' },
        { date: '31-Mar-2022', type: 'interest-paid', amount: 6588.68, description: 'Q1 2022 Interest Disbursement' },
        { date: '30-Jun-2022', type: 'interest-earned', amount: 6751.02, description: 'Q2 2022 Interest @ 2.5% quarterly' },
        { date: '30-Jun-2022', type: 'interest-paid', amount: 6751.02, description: 'Q2 2022 Interest Disbursement' },
        { date: '30-Sep-2022', type: 'interest-earned', amount: 6919.78, description: 'Q3 2022 Interest @ 2.5% quarterly' },
        { date: '30-Sep-2022', type: 'interest-paid', amount: 6919.78, description: 'Q3 2022 Interest Disbursement' },
        { date: '31-Dec-2022', type: 'interest-earned', amount: 7092.77, description: 'Q4 2022 Interest @ 2.5% quarterly' },
        { date: '31-Dec-2022', type: 'interest-paid', amount: 7092.77, description: 'Q4 2022 Interest Disbursement' },
        
        // 2023 Transactions @ 10% to 11% (Oct 1)
        { date: '31-Mar-2023', type: 'interest-earned', amount: 7269.60, description: 'Q1 2023 Interest @ 2.5% quarterly' },
        { date: '31-Mar-2023', type: 'interest-paid', amount: 7269.60, description: 'Q1 2023 Interest Disbursement' },
        { date: '30-Jun-2023', type: 'interest-earned', amount: 7450.34, description: 'Q2 2023 Interest @ 2.5% quarterly' },
        { date: '30-Jun-2023', type: 'interest-paid', amount: 7450.34, description: 'Q2 2023 Interest Disbursement' },
        { date: '30-Sep-2023', type: 'interest-earned', amount: 7635.10, description: 'Q3 2023 Interest @ 2.5% quarterly' },
        { date: '30-Sep-2023', type: 'interest-paid', amount: 7635.10, description: 'Q3 2023 Interest Disbursement' },
        { date: '01-Oct-2023', type: 'rate-change', amount: 0, description: 'Interest rate changed from 10% to 11%', metadata: { oldRate: 10.00, newRate: 11.00 } },
        { date: '31-Dec-2023', type: 'interest-earned', amount: 8423.66, description: 'Q4 2023 Interest @ 2.75% quarterly' },
        { date: '31-Dec-2023', type: 'interest-paid', amount: 8423.66, description: 'Q4 2023 Interest Disbursement' },
        
        // 2024 Transactions @ 11% to 12% (Jul 1)
        { date: '31-Mar-2024', type: 'interest-earned', amount: 8640.40, description: 'Q1 2024 Interest @ 2.75% quarterly' },
        { date: '31-Mar-2024', type: 'interest-paid', amount: 8640.40, description: 'Q1 2024 Interest Disbursement' },
        { date: '30-Jun-2024', type: 'interest-earned', amount: 8878.01, description: 'Q2 2024 Interest @ 2.75% quarterly' },
        { date: '30-Jun-2024', type: 'interest-paid', amount: 8878.01, description: 'Q2 2024 Interest Disbursement' },
        { date: '01-Jul-2024', type: 'rate-change', amount: 0, description: 'Interest rate changed from 11% to 12%', metadata: { oldRate: 11.00, newRate: 12.00 } },
        { date: '30-Sep-2024', type: 'interest-earned', amount: 9743.31, description: 'Q3 2024 Interest @ 3% quarterly' },
        { date: '30-Sep-2024', type: 'interest-paid', amount: 9743.31, description: 'Q3 2024 Interest Disbursement' },
        { date: '31-Dec-2024', type: 'interest-earned', amount: 10000.00, description: 'Q4 2024 Interest @ 3% quarterly' },
        { date: '31-Dec-2024', type: 'interest-paid', amount: 10000.00, description: 'Q4 2024 Interest Disbursement' },
        
        // 2025 Transactions @ 12%
        { date: '13-Feb-2025', type: 'investment', amount: 500000.00, description: 'Additional Investment Feb 13' },
        { date: '26-Mar-2025', type: 'withdrawal', amount: 20381.61, description: 'Redemption' },
        { date: '31-Mar-2025', type: 'interest-earned', amount: 61604.61, description: 'Interest earned this quarter (January - March 2025) @ 12%' },
        { date: '31-Mar-2025', type: 'interest-paid', amount: 61604.61, description: 'Q1 2025 Interest Disbursement' },
        { date: '30-Jun-2025', type: 'interest-earned', amount: 71033.91, description: 'Interest earned this quarter (April - June 2025) @ 12%' },
        { date: '30-Jun-2025', type: 'interest-paid', amount: 71033.91, description: 'Q2 2025 Interest Disbursement' },
        { date: '30-Sep-2025', type: 'interest-earned', amount: 71033.91, description: 'Interest earned this quarter (July - September 2025) @ 12%' },
        { date: '30-Sep-2025', type: 'interest-paid', amount: 71033.91, description: 'Q3 2025 Interest Disbursement' }
      ]
    },
    
    // INVESTOR PC3: Patel Capital 3 (CORRECTED - $400k ADDED BACK)
    {
      id: 'pc3',
      name: 'Patel Capital 3',
      address: '6608 Brynhurst Drive, Tucker, GA 30084',
      email: 'pc3@patel-capital.net',
      phone: '',
      initialInvestment: 703736.40,
      currentBalance: 1793015.01,
      interestRate: 12.00,
      startDate: '01-Oct-2023',
      reinvesting: false,
      transactions: [
        // 2023 Transactions @ 11% (quarterly compounding, started Oct 1)
        { date: '01-Oct-2023', type: 'initial', amount: 662835.00, description: 'Initial Investment @ 11%' },
        { date: '01-Oct-2023', type: 'investment', amount: 40901.40, description: 'Transfer In Oct 1' },
        { date: '23-Oct-2023', type: 'withdrawal', amount: 200000.00, description: 'Redemption' },
        { date: '31-Dec-2023', type: 'withdrawal', amount: 64639.12, description: 'Redemption' },
        { date: '31-Dec-2023', type: 'investment', amount: 7295.44, description: 'Additional Investment (effective Jan 1)' },
        { date: '31-Dec-2023', type: 'interest-earned', amount: 15116.34, description: 'Interest earned this quarter (October - December 2023) @ 11%' },
        { date: '31-Dec-2023', type: 'interest-paid', amount: 15116.34, description: 'Q4 2023 Interest Disbursement' },
        
        // 2024 Transactions @ 11% to 12% (Jul 1) - CORRECTED with $400k added back
        { date: '01-Jan-2024', type: 'investment', amount: 400000.00, description: 'CORRECTION: $400k over-redemption added back' },
        { date: '03-Jan-2024', type: 'withdrawal', amount: 100000.00, description: 'Redemption' },
        { date: '05-Jan-2024', type: 'withdrawal', amount: 1666.67, description: 'Redemption' },
        { date: '31-Jan-2024', type: 'investment', amount: 1000.00, description: 'Additional Investment (effective Feb 1)' },
        { date: '31-Jan-2024', type: 'investment', amount: 539.89, description: 'Additional Investment (effective Feb 1)' },
        { date: '02-Feb-2024', type: 'withdrawal', amount: 101666.67, description: 'Redemption' },
        { date: '05-Feb-2024', type: 'withdrawal', amount: 250000.00, description: 'Redemption' },
        { date: '01-Mar-2024', type: 'investment', amount: 2140.13, description: 'Additional Investment Mar 1' },
        { date: '31-Mar-2024', type: 'interest-earned', amount: 30430.51, description: 'Interest earned this quarter (January - March 2024) @ 11%' },
        { date: '31-Mar-2024', type: 'interest-paid', amount: 30430.51, description: 'Q1 2024 Interest Disbursement' },
        { date: '01-Apr-2024', type: 'investment', amount: 300000.00, description: 'Additional Investment Apr 1' },
        { date: '01-May-2024', type: 'investment', amount: 100000.00, description: 'Additional Investment May 1' },
        { date: '30-Jun-2024', type: 'interest-earned', amount: 37343.58, description: 'Interest earned this quarter (April - June 2024) @ 11%' },
        { date: '30-Jun-2024', type: 'interest-paid', amount: 37343.58, description: 'Q2 2024 Interest Disbursement' },
        { date: '01-Jul-2024', type: 'rate-change', amount: 0, description: 'Interest rate changed from 11% to 12%', metadata: { oldRate: 11.00, newRate: 12.00 } },
        { date: '26-Aug-2024', type: 'withdrawal', amount: 250000.00, description: 'Redemption' },
        { date: '30-Sep-2024', type: 'interest-earned', amount: 36738.45, description: 'Interest earned this quarter (July - September 2024) @ 12%' },
        { date: '30-Sep-2024', type: 'interest-paid', amount: 36738.45, description: 'Q3 2024 Interest Disbursement' },
        { date: '31-Dec-2024', type: 'interest-earned', amount: 34238.45, description: 'Interest earned this quarter (October - December 2024) @ 12%' },
        { date: '31-Dec-2024', type: 'interest-paid', amount: 34238.45, description: 'Q4 2024 Interest Disbursement' },
        
        // 2025 Transactions @ 12%
        { date: '31-Mar-2025', type: 'interest-earned', amount: 34238.45, description: 'Interest earned this quarter (January - March 2025) @ 12%' },
        { date: '31-Mar-2025', type: 'interest-paid', amount: 34238.45, description: 'Q1 2025 Interest Disbursement' },
        { date: '01-May-2025', type: 'investment', amount: 651733.34, description: 'Additional Investment May 1' },
        { date: '30-Jun-2025', type: 'interest-earned', amount: 47062.88, description: 'Interest earned this quarter (April - June 2025) @ 12%' },
        { date: '30-Jun-2025', type: 'interest-paid', amount: 47062.88, description: 'Q2 2025 Interest Disbursement' },
        { date: '30-Sep-2025', type: 'interest-earned', amount: 53790.45, description: 'Interest earned this quarter (July - September 2025) @ 12%' },
        { date: '30-Sep-2025', type: 'interest-paid', amount: 53790.45, description: 'Q3 2025 Interest Disbursement' }
      ]
    }
  ]
});
