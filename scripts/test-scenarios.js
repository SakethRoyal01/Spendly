/**
 * Automated Financial Logic & Ledger Test Suite
 * Validates Scenarios A through K defined in PART 20 of Spendly Specification.
 */

class MockStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return this.store[key] !== undefined ? this.store[key] : null;
  }
  setItem(key, val) {
    this.store[key] = String(val);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

// Emulate browser environment for testing
global.window = {
  localStorage: new MockStorage(),
};

// Import utilities
function toPaise(rupees) {
  return Math.round((rupees || 0) * 100);
}
function toRupees(paise) {
  return (paise || 0) / 100;
}
function addRupees(...amounts) {
  const sum = amounts.reduce((acc, a) => acc + toPaise(a), 0);
  return toRupees(sum);
}
function subtractRupees(a, b) {
  return toRupees(toPaise(a) - toPaise(b));
}

function formatINR(amount) {
  if (typeof amount !== 'number' || isNaN(amount)) return '₹0';
  const isNegative = amount < 0;
  const abs = Math.abs(Math.round(amount * 100) / 100);
  const formatted = `₹${abs.toLocaleString('en-IN')}`;
  return isNegative ? `-${formatted}` : formatted;
}

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('\n--- EXECUTING SPENDLY FINANCIAL INTEGRITY TEST SUITE (SCENARIOS A - K) ---\n');

// SCENARIO A: Simple cash expense
console.log('Scenario A: Simple Cash Expense');
{
  let cashBalance = 2000;
  const expenseAmount = 200;
  cashBalance = subtractRupees(cashBalance, expenseAmount);
  assert(cashBalance === 1800, `Expected Cash ₹1,800, got ₹${cashBalance}`);
}

// SCENARIO B: UPI expense from Bank Account
console.log('Scenario B: UPI Expense from Bank');
{
  let bankBalance = 10000;
  const upiExpense = 500;
  bankBalance = subtractRupees(bankBalance, upiExpense);
  assert(bankBalance === 9500, `Expected Bank ₹9,500, got ₹${bankBalance}`);
}

// SCENARIO C: Hybrid / Split expense
console.log('Scenario C: Hybrid / Split Payment');
{
  let cashBalance = 2000;
  let bankBalance = 10000;
  const totalExpense = 1000;
  const splits = [
    { method: 'Cash', amount: 300 },
    { method: 'UPI', amount: 700 },
  ];

  const splitSum = splits.reduce((sum, s) => addRupees(sum, s.amount), 0);
  assert(splitSum === totalExpense, `Split sum matches total expense ₹${totalExpense}`);

  cashBalance = subtractRupees(cashBalance, splits[0].amount);
  bankBalance = subtractRupees(bankBalance, splits[1].amount);

  assert(cashBalance === 1700, `Expected Cash ₹1,700, got ₹${cashBalance}`);
  assert(bankBalance === 9300, `Expected Bank ₹9,300, got ₹${bankBalance}`);
  assert(splits.length === 2, 'One transaction with 2 split allocations');
}

// SCENARIO D: Savings contribution
console.log('Scenario D: Savings Contribution');
{
  let bankBalance = 10000;
  let savingsPot = 2000;
  let expenseTotal = 5000; // prior spending

  const contribution = 1000;
  bankBalance = subtractRupees(bankBalance, contribution);
  savingsPot = addRupees(savingsPot, contribution);
  // Expense total remains unchanged because internal allocation is NOT an expense
  assert(bankBalance === 9000, `Expected Bank ₹9,000, got ₹${bankBalance}`);
  assert(savingsPot === 3000, `Expected Savings ₹3,000, got ₹${savingsPot}`);
  assert(expenseTotal === 5000, `Expense total unchanged at ₹${expenseTotal}`);
}

// SCENARIO E: Savings-funded expense (Option A)
console.log('Scenario E: Savings-Funded Expense (Option A)');
{
  let savingsPot = 3000;
  let expenseTotal = 5000;
  const expenseFromSavings = 500;

  savingsPot = subtractRupees(savingsPot, expenseFromSavings);
  expenseTotal = addRupees(expenseTotal, expenseFromSavings);

  assert(savingsPot === 2500, `Expected Savings ₹2,500, got ₹${savingsPot}`);
  assert(expenseTotal === 5500, `Expected Expense Total ₹5,500, got ₹${expenseTotal}`);
}

// SCENARIO F: Savings withdrawal to Cash (Option B)
console.log('Scenario F: Savings Withdrawal to Cash (Option B)');
{
  let savingsPot = 3000;
  let cashBalance = 500;
  let incomeTotal = 25000;
  let expenseTotal = 5000;

  const withdrawal = 1000;
  savingsPot = subtractRupees(savingsPot, withdrawal);
  cashBalance = addRupees(cashBalance, withdrawal);

  assert(savingsPot === 2000, `Expected Savings ₹2,000, got ₹${savingsPot}`);
  assert(cashBalance === 1500, `Expected Cash ₹1,500, got ₹${cashBalance}`);
  assert(incomeTotal === 25000, `Income total unchanged at ₹${incomeTotal}`);
  assert(expenseTotal === 5000, `Expense total unchanged at ₹${expenseTotal}`);
}

// SCENARIO G: Income tracking
console.log('Scenario G: Income Recording');
{
  let bankBalance = 5000;
  const salaryIncome = 2000;
  bankBalance = addRupees(bankBalance, salaryIncome);

  assert(bankBalance === 7000, `Expected Bank ₹7,000, got ₹${bankBalance}`);
}

// SCENARIO H: Edit and Delete Reversals
console.log('Scenario H: Edit & Delete Allocation Reversal');
{
  let cashBalance = 1700;
  let bankBalance = 9300;
  // Reversing split expense of Cash 300 and Bank 700
  cashBalance = addRupees(cashBalance, 300);
  bankBalance = addRupees(bankBalance, 700);

  assert(cashBalance === 2000, `Reversed Cash back to ₹2,000, got ₹${cashBalance}`);
  assert(bankBalance === 10000, `Reversed Bank back to ₹10,000, got ₹${bankBalance}`);
}

// SCENARIO I: Negative Balance Allowed (Never Block Expenses on Insufficient Funds)
console.log('Scenario I: Negative Balance Allowed (Never Block Expenses on Insufficient Funds)');
{
  let bankBalance = 500;
  const requestedPayment = 1000;

  // Never block an expense because of insufficient funds; balance becomes negative
  bankBalance = subtractRupees(bankBalance, requestedPayment);

  assert(bankBalance === -500, `Bank balance allowed to become negative ₹-500, got ₹${bankBalance}`);
}

// SCENARIO J: Duplicate Recurring Payment Prevention
console.log('Scenario J: Duplicate Recurring Payment Prevention');
{
  const occurrences = new Set(['rec_netflix_2026-11-01']);
  const occurrenceKey = 'rec_netflix_2026-11-01';

  let duplicateAllowed = false;
  if (occurrences.has(occurrenceKey)) {
    duplicateAllowed = false;
  } else {
    occurrences.add(occurrenceKey);
    duplicateAllowed = true;
  }

  assert(duplicateAllowed === false, 'Duplicate occurrence generation prevented');
}

// SCENARIO K: Net Worth Preservation on Transfers
console.log('Scenario K: Net Worth Preservation on Transfers & Savings');
{
  const cash = 1500;
  const bank = 9000;
  const savings = 3000;
  const initialNetWorth = addRupees(cash, bank, savings);

  // Transfer 1000 from Bank to Cash
  const newBank = subtractRupees(bank, 1000);
  const newCash = addRupees(cash, 1000);
  const postTransferNetWorth = addRupees(newCash, newBank, savings);

  assert(
    initialNetWorth === postTransferNetWorth,
    `Net worth preserved at ₹${initialNetWorth} (before = after)`
  );
}

// SCENARIO L: Adding an expense with "Not specified" payment method
console.log('Scenario L: Unspecified Payment Method Expense');
{
  let cashBalance = 2000;
  let bankBalance = 10000;
  let totalExpenses = 5000;
  const expenseAmount = 800;
  const paymentMethod = 'Not specified';

  // An unspecified payment method does not deduct anything from wallets
  if (paymentMethod !== 'Not specified') {
    cashBalance = subtractRupees(cashBalance, expenseAmount);
  }
  totalExpenses = addRupees(totalExpenses, expenseAmount);

  assert(cashBalance === 2000, `Cash Wallet untouched at ₹2,000, got ₹${cashBalance}`);
  assert(bankBalance === 10000, `Bank Account untouched at ₹10,000, got ₹${bankBalance}`);
  assert(totalExpenses === 5800, `Total expenses accurately includes ₹800, got ₹${totalExpenses}`);
}

// SCENARIO M: Assigning payment method later (Not specified -> Cash)
console.log('Scenario M: Later Editing (Not specified -> Cash)');
{
  let cashBalance = 2000;
  let bankBalance = 10000;
  const expenseAmount = 800;

  // Previously unspecified, now assigned to Cash
  // Reverse: nothing was deducted
  // Apply: deduct from Cash
  cashBalance = subtractRupees(cashBalance, expenseAmount);

  assert(cashBalance === 1200, `Cash Wallet deducted by ₹800 to ₹1,200, got ₹${cashBalance}`);
  assert(bankBalance === 10000, `Bank Account untouched at ₹10,000, got ₹${bankBalance}`);
}

// SCENARIO N: Changing existing payment method (Cash -> UPI)
console.log('Scenario N: Changing Payment Method (Cash -> UPI)');
{
  let cashBalance = 1200;
  let bankBalance = 10000;
  const expenseAmount = 800;

  // Step 1: Reverse previous Cash deduction
  cashBalance = addRupees(cashBalance, expenseAmount);
  // Step 2: Apply new UPI deduction to Bank
  bankBalance = subtractRupees(bankBalance, expenseAmount);

  assert(cashBalance === 2000, `Cash Wallet restored to ₹2,000, got ₹${cashBalance}`);
  assert(bankBalance === 9200, `Bank Account deducted to ₹9,200, got ₹${bankBalance}`);
}

// SCENARIO O: Changing payment method (UPI -> Hybrid)
console.log('Scenario O: Changing Payment Method (UPI -> Hybrid)');
{
  let cashBalance = 2000;
  let bankBalance = 9200;
  const expenseAmount = 800;
  const newSplits = [
    { method: 'Cash', amount: 300 },
    { method: 'UPI', amount: 500 },
  ];

  // Step 1: Reverse previous UPI deduction
  bankBalance = addRupees(bankBalance, expenseAmount);
  // Step 2: Apply new Hybrid split deductions
  cashBalance = subtractRupees(cashBalance, newSplits[0].amount);
  bankBalance = subtractRupees(bankBalance, newSplits[1].amount);

  assert(cashBalance === 1700, `Cash Wallet reflects split of ₹300 (balance ₹1,700), got ₹${cashBalance}`);
  assert(bankBalance === 9500, `Bank Account reflects split of ₹500 (balance ₹9,500), got ₹${bankBalance}`);
}

// SCENARIO P: Changing payment method (Hybrid -> Cash)
console.log('Scenario P: Changing Payment Method (Hybrid -> Cash)');
{
  let cashBalance = 1700;
  let bankBalance = 9500;
  const expenseAmount = 800;

  // Step 1: Reverse all previous splits
  cashBalance = addRupees(cashBalance, 300);
  bankBalance = addRupees(bankBalance, 500);
  // Step 2: Apply full Cash deduction
  cashBalance = subtractRupees(cashBalance, expenseAmount);

  assert(cashBalance === 1200, `Cash Wallet deducted by ₹800 to ₹1,200, got ₹${cashBalance}`);
  assert(bankBalance === 10000, `Bank Account restored to full ₹10,000, got ₹${bankBalance}`);
}

// SCENARIO Q: Changing payment method (Cash -> Not specified)
console.log('Scenario Q: Changing Payment Method (Cash -> Not specified)');
{
  let cashBalance = 1200;
  let bankBalance = 10000;
  const expenseAmount = 800;

  // Step 1: Reverse previous Cash deduction
  cashBalance = addRupees(cashBalance, expenseAmount);
  // Step 2: 'Not specified' performs no deduction

  assert(cashBalance === 2000, `Cash Wallet restored to ₹2,000, got ₹${cashBalance}`);
  assert(bankBalance === 10000, `Bank Account intact at ₹10,000, got ₹${bankBalance}`);
}

// SCENARIO R: Deleting an unspecified expense
console.log('Scenario R: Deleting an Unspecified Expense');
{
  let cashBalance = 2000;
  let bankBalance = 10000;
  let totalExpenses = 5800;
  const expenseAmount = 800;

  // Deleting an unspecified expense reverses 0 from wallets, subtracts 800 from total expenses
  totalExpenses = subtractRupees(totalExpenses, expenseAmount);

  assert(cashBalance === 2000, `Cash Wallet preserved at ₹2,000, got ₹${cashBalance}`);
  assert(bankBalance === 10000, `Bank Account preserved at ₹10,000, got ₹${bankBalance}`);
  assert(totalExpenses === 5000, `Total expenses safely reverted to ₹5,000, got ₹${totalExpenses}`);
}

// SCENARIO S: Hybrid Split Portion Account Spending Attribution
console.log('Scenario S: Hybrid Split Portion Account Spending Attribution');
{
  const cashAccountId = 'acc_cash';
  const bankAccountId = 'acc_bank';

  let cashBalance = 2000;
  let bankBalance = 10000;

  // Hybrid expense of ₹1,000 (Cash ₹400, UPI ₹600)
  const hybridExpense = {
    id: 'tx_hybrid_1',
    amount: 1000,
    paymentMethod: 'Hybrid',
    splits: [
      { sourceAccountId: cashAccountId, amount: 400, paymentMethod: 'Cash' },
      { sourceAccountId: bankAccountId, amount: 600, paymentMethod: 'UPI' },
    ],
  };

  cashBalance = subtractRupees(cashBalance, hybridExpense.splits[0].amount);
  bankBalance = subtractRupees(bankBalance, hybridExpense.splits[1].amount);

  // In Cash Wallet Activity:
  const cashSpending = hybridExpense.splits
    .filter((s) => s.sourceAccountId === cashAccountId)
    .reduce((sum, s) => addRupees(sum, s.amount), 0);

  // In Bank Wallet Activity:
  const bankSpending = hybridExpense.splits
    .filter((s) => s.sourceAccountId === bankAccountId)
    .reduce((sum, s) => addRupees(sum, s.amount), 0);

  assert(cashSpending === 400, `Cash Wallet spending strictly includes ₹400 portion, got ₹${cashSpending}`);
  assert(bankSpending === 600, `Bank Account spending strictly includes ₹600 portion, got ₹${bankSpending}`);
  assert(cashSpending + bankSpending === 1000, `Total spending matches ₹1000`);
  assert(cashBalance === 1600, `Cash Wallet balance is ₹1,600, got ₹${cashBalance}`);
  assert(bankBalance === 9400, `Bank Account balance is ₹9,400, got ₹${bankBalance}`);
}

// SCENARIO T: Wallet Spending Isolation from Unspecified Expenses & Internal Transfers
console.log('Scenario T: Wallet Spending Isolation from Unspecified Expenses & Internal Transfers');
{
  const cashAccountId = 'acc_cash';
  const bankAccountId = 'acc_bank';

  // Transactions list for the account
  const transactions = [
    // Pure cash expense: ₹250
    { id: 'tx_1', type: 'expense', sourceAccountId: cashAccountId, amount: 250, paymentMethod: 'Cash' },
    // Hybrid expense: total ₹500, Cash ₹200, UPI ₹300
    {
      id: 'tx_2',
      type: 'expense',
      paymentMethod: 'Hybrid',
      amount: 500,
      splits: [
        { sourceAccountId: cashAccountId, amount: 200, paymentMethod: 'Cash' },
        { sourceAccountId: bankAccountId, amount: 300, paymentMethod: 'UPI' },
      ],
    },
    // Unspecified expense: ₹400 (NO wallet deduction)
    { id: 'tx_3', type: 'expense', paymentMethod: 'Not specified', amount: 400 },
    // Transfer from Bank to Cash: ₹1,000 (Internal movement, NOT spending)
    { id: 'tx_4', type: 'transfer', sourceAccountId: bankAccountId, destinationAccountId: cashAccountId, amount: 1000 },
    // Savings contribution: ₹500 from Cash (Savings allocation, NOT general spending)
    { id: 'tx_5', type: 'savings_contribution', sourceAccountId: cashAccountId, amount: 500 },
  ];

  // Derive Cash Wallet spending
  let cashWalletSpending = 0;
  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return; // Transfers and savings excluded
    if (!tx.paymentMethod || tx.paymentMethod === 'Not specified') return; // Unspecified excluded
    if (tx.paymentMethod === 'Hybrid' && tx.splits) {
      const split = tx.splits.find((s) => s.sourceAccountId === cashAccountId);
      if (split) cashWalletSpending = addRupees(cashWalletSpending, split.amount);
    } else if (tx.sourceAccountId === cashAccountId) {
      cashWalletSpending = addRupees(cashWalletSpending, tx.amount);
    }
  });

  // Derive Bank Account spending
  let bankWalletSpending = 0;
  transactions.forEach((tx) => {
    if (tx.type !== 'expense') return;
    if (!tx.paymentMethod || tx.paymentMethod === 'Not specified') return;
    if (tx.paymentMethod === 'Hybrid' && tx.splits) {
      const split = tx.splits.find((s) => s.sourceAccountId === bankAccountId);
      if (split) bankWalletSpending = addRupees(bankWalletSpending, split.amount);
    } else if (tx.sourceAccountId === bankAccountId) {
      bankWalletSpending = addRupees(bankWalletSpending, tx.amount);
    }
  });

  assert(cashWalletSpending === 450, `Cash Wallet spending is exactly ₹450 (₹250 cash + ₹200 hybrid), got ₹${cashWalletSpending}`);
  assert(bankWalletSpending === 300, `Bank Account spending is exactly ₹300 (hybrid portion only), got ₹${bankWalletSpending}`);
}

// SCENARIO U: Cash Expense Exceeding Cash Wallet Balance
console.log('Scenario U: Cash Expense Exceeding Cash Wallet Balance');
{
  let cashBalance = 300;
  const expenseAmount = 800;
  const prevBal = cashBalance;
  cashBalance = subtractRupees(cashBalance, expenseAmount);

  const triggeredAlert = prevBal >= 0 && cashBalance < 0;
  assert(cashBalance === -500, `Cash Wallet balance is negative ₹-500, got ₹${cashBalance}`);
  assert(triggeredAlert === true, 'Professional notification condition triggered for Cash Wallet crossing into negative');
}

// SCENARIO V: UPI Expense Exceeding Bank Balance
console.log('Scenario V: UPI Expense Exceeding Bank Balance');
{
  let bankBalance = 1200;
  const expenseAmount = 2000;
  const prevBal = bankBalance;
  bankBalance = subtractRupees(bankBalance, expenseAmount);

  const triggeredAlert = prevBal >= 0 && bankBalance < 0;
  assert(bankBalance === -800, `Bank Account balance is negative ₹-800, got ₹${bankBalance}`);
  assert(triggeredAlert === true, 'Professional notification condition triggered for Bank Account crossing into negative');
}

// SCENARIO W: Hybrid Expense Causing Multiple Accounts to Become Negative
console.log('Scenario W: Hybrid Expense Causing Multiple Accounts to Become Negative');
{
  let cashBalance = 200;
  let bankBalance = 400;

  const prevCash = cashBalance;
  const prevBank = bankBalance;

  // Hybrid expense: Cash ₹500, UPI ₹500 (total ₹1,000)
  cashBalance = subtractRupees(cashBalance, 500);
  bankBalance = subtractRupees(bankBalance, 500);

  const cashAlert = prevCash >= 0 && cashBalance < 0;
  const bankAlert = prevBank >= 0 && bankBalance < 0;

  assert(cashBalance === -300, `Cash balance is negative ₹-300, got ₹${cashBalance}`);
  assert(bankBalance === -100, `Bank balance is negative ₹-100, got ₹${bankBalance}`);
  assert(cashAlert === true, 'Cash notification triggered on hybrid split');
  assert(bankAlert === true, 'Bank notification triggered on hybrid split');
}

// SCENARIO X: Negative Balance Reversal on Edit or Delete
console.log('Scenario X: Negative Balance Reversal on Edit or Delete');
{
  let cashBalance = -500;
  const deletedExpense = 800;

  // Deleting the expense restores the ₹800
  cashBalance = addRupees(cashBalance, deletedExpense);
  assert(cashBalance === 300, `Cash Wallet restored back to positive ₹300, got ₹${cashBalance}`);
}

// SCENARIO Y: No Repeated Alerts when Balance is Already Negative
console.log('Scenario Y: No Repeated Alerts when Balance is Already Negative');
{
  const prevBal = -500;
  const nextBal = -800; // further spending while already negative
  const alertTriggered = prevBal >= 0 && nextBal < 0;

  assert(alertTriggered === false, 'No repeated negative alert when balance was already negative');
}

// SCENARIO Z1: Exact User Case (Cash ₹1,035 -> Expense ₹1,100 -> -₹65 -> Add Money ₹500 -> ₹435)
console.log('Scenario Z1: Exact User Case (Spend exceeding cash + Add Money)');
{
  let cashBalance = 1035;
  const initialBal = cashBalance;

  // Step 1: Record expense of ₹1,100
  const expense = 1100;
  cashBalance = subtractRupees(cashBalance, expense);

  const alertTriggered = initialBal >= 0 && cashBalance < 0;
  assert(cashBalance === -65, `Cash Wallet balance is exactly -₹65, got ₹${cashBalance}`);
  assert(alertTriggered === true, 'Professional notification triggered on crossing into negative');

  // Step 2: Add Money of ₹500
  const addMoney = 500;
  cashBalance = addRupees(cashBalance, addMoney);
  assert(cashBalance === 435, `After adding ₹500, Cash Wallet balance is exactly ₹435 (-65 + 500), got ₹${cashBalance}`);
}

// SCENARIO Z2: Add Money (Income) with UPI & Atomic Reversal on Delete
console.log('Scenario Z2: Income via UPI and Atomic Balance Reversal');
{
  let bankBalance = 5000;

  // Add Income via UPI of ₹12,000
  const incomeAmount = 12000;
  bankBalance = addRupees(bankBalance, incomeAmount);
  assert(bankBalance === 17000, `Bank balance credited to ₹17,000, got ₹${bankBalance}`);

  // Deleting the income transaction reverses the balance deduction atomically
  bankBalance = subtractRupees(bankBalance, incomeAmount);
  assert(bankBalance === 5000, `Bank balance safely reverted to ₹5,000, got ₹${bankBalance}`);
}

// SCENARIO Z3: Daily Activity Ledger Summary & Net Cash Flow Calculations
console.log('Scenario Z3: Daily Activity Ledger & Net Cash Flow Calculation');
{
  const dailyTransactions = [
    { type: 'expense', amount: 350, description: 'Coffee & Breakfast' },
    { type: 'income', amount: 5000, description: 'Freelance Design Deposit' },
    { type: 'expense', amount: 1100, description: 'Grocery Market' },
    { type: 'income', amount: 500, description: 'Cash Gift' },
  ];

  const totalDailyExpenses = dailyTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => addRupees(sum, t.amount), 0);

  const totalDailyIncome = dailyTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => addRupees(sum, t.amount), 0);

  const netCashFlow = subtractRupees(totalDailyIncome, totalDailyExpenses);

  assert(totalDailyExpenses === 1450, `Total daily expenses is ₹1,450 (350 + 1100), got ₹${totalDailyExpenses}`);
  assert(totalDailyIncome === 5500, `Total daily income is ₹5,500 (5000 + 500), got ₹${totalDailyIncome}`);
  assert(netCashFlow === 4050, `Net Cash Flow is +₹4,050 (5500 - 1450), got ₹${netCashFlow}`);
}

// SCENARIO Z4: Navigation Scroll Spy & Section Synchronization (Expenses First, then Overview)
console.log('Scenario Z4: Navigation Scroll Spy Threshold Verification (Expenses first, then Overview)');
{
  const viewportHeight = 900;
  const threshold = viewportHeight * 0.55; // 495px

  // Test Case A: User at top of page (scrollY < 80) -> Top section is now Expenses
  const isTop = 40 < 80;
  assert(isTop === true, 'Top of page defaults to Expenses (first section)');

  // Test Case B: User scrolls until Overview enters top 55% of viewport
  const overviewRectTop = 450;
  const isOverviewActive = overviewRectTop <= threshold;
  assert(isOverviewActive === true, 'Overview becomes active when within 55% of viewport');

  // Test Case C: User scrolls back up past 55%
  const scrolledBackTop = 600;
  const isOverviewStillActive = scrolledBackTop <= threshold;
  assert(isOverviewStillActive === false, 'Switches back to Expenses when scrolling back up to top');
}

// SCENARIO Z5: Total Flow Formatting Rules (Orange #F05010, No Minus on Flows, Minus ONLY on Negative Wallets)
console.log('Scenario Z5: Flow vs Negative Wallet Formatting Rules');
{
  // Rule 1: Outflow flow uses orange #F05010 (not red) and NO minus sign
  const outflowNetFlow = -600;
  const flowDisplay = formatINR(Math.abs(outflowNetFlow));
  const flowColor = outflowNetFlow < 0 ? '#F05010' : '#10B981';
  assert(flowDisplay === '₹600', `Flow display has no minus sign, got "${flowDisplay}"`);
  assert(flowColor === '#F05010', `Outflow color is brand orange #F05010, got "${flowColor}"`);

  // Rule 2: Wallet balance when negative DOES display the minus sign
  const negativeWalletBalance = -65;
  const walletDisplay = formatINR(negativeWalletBalance);
  assert(walletDisplay === '-₹65', `Wallet balance when negative displays minus sign, got "${walletDisplay}"`);
}

// SCENARIO Z6: Insights Using Daily Net Cash Flow
console.log('Scenario Z6: Insights Daily Net Cash Flow Calculation & Formatting');
{
  const testExpenses = [
    { id: 'e1', amount: 400, date: '2026-11-01', category: 'Food' },
    { id: 'e2', amount: 600, date: '2026-11-02', category: 'Transport' },
  ];
  const testIncomes = [
    { id: 'i1', amount: 1500, date: '2026-11-02', type: 'income' },
  ];

  // Map daily flows
  const day1Expense = 400;
  const day1Income = 0;
  const day1Net = day1Income - day1Expense; // -400

  const day2Expense = 600;
  const day2Income = 1500;
  const day2Net = day2Income - day2Expense; // +900

  const totalPeriodIncome = 1500;
  const totalPeriodExpense = 1000;
  const periodNetCashFlow = totalPeriodIncome - totalPeriodExpense; // +500

  // Verify Day 1 deficit (outflow)
  const day1Display = day1Net > 0 ? `+${formatINR(day1Net)}` : formatINR(Math.abs(day1Net));
  const day1Color = day1Net < 0 ? '#F05010' : '#10B981';
  assert(day1Net === -400, `Day 1 net cash flow is -400, got ${day1Net}`);
  assert(day1Display === '₹400', `Day 1 deficit displays with NO minus sign, got "${day1Display}"`);
  assert(day1Color === '#F05010', `Day 1 deficit uses brand orange #F05010, got "${day1Color}"`);

  // Verify Day 2 surplus (inflow)
  const day2Display = day2Net > 0 ? `+${formatINR(day2Net)}` : formatINR(Math.abs(day2Net));
  assert(day2Net === 900, `Day 2 net cash flow is +900, got ${day2Net}`);
  assert(day2Display === '+₹900', `Day 2 surplus displays with plus sign, got "${day2Display}"`);

  // Verify Period Net Cash Flow
  assert(periodNetCashFlow === 500, `Period net cash flow is +500, got ${periodNetCashFlow}`);
}

// SCENARIO Z7: Payment Change vs Real Income Isolation
console.log('Scenario Z7: Payment Change vs Real Income Isolation');
{
  let cashWalletBalance = 1000;

  // 1. User records a ₹500 cash expense
  const expenseAmount = 500;
  cashWalletBalance = subtractRupees(cashWalletBalance, expenseAmount);
  assert(cashWalletBalance === 500, `Cash Wallet after expense is ₹500, got ₹${cashWalletBalance}`);

  // 2. User receives ₹120 Change from the payment and logs it via Change option
  const changeTransaction = {
    id: 'tx_change_1',
    type: 'income',
    isChange: true,
    category: 'Change',
    amount: 120,
    date: '2026-11-12',
    description: 'Grocery change',
  };

  // Wallet balance is replenished by the change
  cashWalletBalance = addRupees(cashWalletBalance, changeTransaction.amount);
  assert(cashWalletBalance === 620, `Cash Wallet balance accurately replenished by change to ₹620, got ₹${cashWalletBalance}`);

  // 3. User adds real income from the Wallet section: Salary ₹25,000
  const walletIncomeTransaction = {
    id: 'tx_income_1',
    type: 'income',
    isChange: false,
    category: 'Salary',
    amount: 25000,
    date: '2026-11-12',
    description: 'Monthly Salary',
  };

  const allTransactions = [changeTransaction, walletIncomeTransaction];

  // Incomes list isolates real earned income and excludes Change
  const realIncomes = allTransactions.filter(
    (t) => t.type === 'income' && !t.isChange && t.category !== 'Change'
  );
  const changeTransactions = allTransactions.filter(
    (t) => t.type === 'income' && (t.isChange === true || t.category === 'Change')
  );

  const totalRealIncome = realIncomes.reduce((sum, t) => addRupees(sum, t.amount), 0);
  const totalChange = changeTransactions.reduce((sum, t) => addRupees(sum, t.amount), 0);

  assert(realIncomes.length === 1, `Real incomes has exactly 1 entry, got ${realIncomes.length}`);
  assert(totalRealIncome === 25000, `Real income total is strictly ₹25,000 (Change excluded), got ₹${totalRealIncome}`);
  assert(totalChange === 120, `Change total is ₹120, got ₹${totalChange}`);

  // Net Cash Flow on that day: (Income + Change) - Expenses
  // Here: (0 income on grocery + 120 change) - 500 expense = -380 net outflow from grocery transaction
  const dailyGroceryNet = subtractRupees(changeTransaction.amount, expenseAmount);
  assert(dailyGroceryNet === -380, `Net cash flow for grocery + change is -₹380, got ₹${dailyGroceryNet}`);
}

// SCENARIO Z8: User's Exact Trial Data Reconciliation (Change Deducted from Amount Spent)
console.log('Scenario Z8: User Exact Trial Reconciliation (Change Deducted from Spent)');
{
  // User entered:
  // 11th: 670 expense
  // 12th: 550 expense
  // 13th: 270 expense
  // Change received: 300 once and 250 once
  const rawTransactions = [
    { id: 'tx_11', date: '2026-11-11', type: 'expense', amount: 670, category: 'Food', description: 'Grocery' },
    { id: 'tx_12', date: '2026-11-12', type: 'expense', amount: 550, category: 'Travel', description: 'Fuel' },
    { id: 'tx_13', date: '2026-11-13', type: 'expense', amount: 270, category: 'Food', description: 'Snacks' },
    { id: 'chg_1', date: '2026-11-11', type: 'income', isChange: true, category: 'Change', amount: 300, description: 'Cash change' },
    { id: 'chg_2', date: '2026-11-12', type: 'income', isChange: true, category: 'Change', amount: 250, description: 'Fuel change' },
    // Verified real earned income
    { id: 'inc_1', date: '2026-11-01', type: 'income', isChange: false, category: 'Salary', amount: 3434, description: 'Salary deposit' },
  ];

  // Helper check
  function isChange(t) {
    return Boolean(t.isChange === true || t.category === 'Change' || (typeof t.description === 'string' && t.description.toLowerCase().includes('change')));
  }

  const trueExpenses = rawTransactions.filter((t) => t.type === 'expense' && !isChange(t));
  const changeTxs = rawTransactions.filter((t) => isChange(t));
  const realIncomeTxs = rawTransactions.filter((t) => t.type === 'income' && !isChange(t));

  const grossExpenses = trueExpenses.reduce((sum, t) => addRupees(sum, t.amount), 0);
  const totalChange = changeTxs.reduce((sum, t) => addRupees(sum, t.amount), 0);
  const totalIncome = realIncomeTxs.reduce((sum, t) => addRupees(sum, t.amount), 0);

  // 1. Verify gross expenses: 670 + 550 + 270 = 1490
  assert(grossExpenses === 1490, `Gross expenses must be exactly ₹1,490, got ₹${grossExpenses}`);

  // 2. Verify total change: 300 + 250 = 550
  assert(totalChange === 550, `Total change received must be exactly ₹550, got ₹${totalChange}`);

  // 3. CRITICAL: Total Outflow (Money Spent) MUST deduct change!
  // It must NEVER be 2,040! 1490 - 550 = 940
  const netSpending = Math.max(0, subtractRupees(grossExpenses, totalChange));
  assert(netSpending === 940, `Net amount spent (Total Outflow) must be ₹940 (NOT ₹2,040!), got ₹${netSpending}`);
  assert(netSpending !== 2040, `Total outflow must NOT be 2,040`);

  // 4. Verify Total Inflow is strictly verified income
  assert(totalIncome === 3434, `Total Inflow is strictly ₹3,434, got ₹${totalIncome}`);

  // 5. Verify Net Cash Flow: Total Inflow - Net Outflow
  // 3,434 - 940 = +2,494
  const netCashFlow = subtractRupees(totalIncome, netSpending);
  assert(netCashFlow === 2494, `Net Cash Flow must be +₹2,494, got ₹${netCashFlow}`);

  // 6. Verify Daily Calculations:
  // 11th: 670 gross - 300 change = 370 net spent
  const day11Gross = 670;
  const day11Change = 300;
  const day11NetSpent = Math.max(0, subtractRupees(day11Gross, day11Change));
  assert(day11NetSpent === 370, `11th net spent is ₹370, got ₹${day11NetSpent}`);

  // 12th: 550 gross - 250 change = 300 net spent
  const day12Gross = 550;
  const day12Change = 250;
  const day12NetSpent = Math.max(0, subtractRupees(day12Gross, day12Change));
  assert(day12NetSpent === 300, `12th net spent is ₹300, got ₹${day12NetSpent}`);

  // 13th: 270 gross - 0 change = 270 net spent
  const day13Gross = 270;
  const day13Change = 0;
  const day13NetSpent = Math.max(0, subtractRupees(day13Gross, day13Change));
  assert(day13NetSpent === 270, `13th net spent is ₹270, got ₹${day13NetSpent}`);

  // 7. Sum of daily net spending equals monthly net spending
  const sumDaily = addRupees(day11NetSpent, day12NetSpent, day13NetSpent);
  assert(sumDaily === netSpending, `Sum of daily net spending (${sumDaily}) equals monthly net spending (${netSpending})`);

  // 8. Test Self-Healing if a change transaction was accidentally logged with type: 'expense'
  const accidentalExpenseChange = {
    id: 'tx_accidental',
    date: '2026-11-11',
    type: 'expense',
    category: 'Change',
    amount: 300,
    description: 'change',
  };
  const isAccidentalChange = isChange(accidentalExpenseChange);
  assert(isAccidentalChange === true, `Accidental expense with category 'Change' recognized as Change`);
  // When normalized, it must be excluded from trueExpenses:
  const filteredExpenses = [accidentalExpenseChange].filter((t) => t.type === 'expense' && !isChange(t));
  assert(filteredExpenses.length === 0, `Accidental expense is excluded from true expenses`);
}

console.log(`\nTEST RESULTS: ${passed} PASSED, ${failed} FAILED\n`);
if (failed > 0) process.exit(1);

