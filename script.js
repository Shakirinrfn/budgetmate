const incomeInput = document.getElementById("incomeInput");
const saveIncomeBtn = document.getElementById("saveIncomeBtn");

const incomeDisplay = document.getElementById("incomeDisplay");
const spentDisplay = document.getElementById("spentDisplay");
const remainingDisplay = document.getElementById("remainingDisplay");

const expenseForm = document.getElementById("expenseForm");
const amountInput = document.getElementById("amountInput");
const categoryInput = document.getElementById("categoryInput");
const noteInput = document.getElementById("noteInput");

const expenseList = document.getElementById("expenseList");
const clearBtn = document.getElementById("clearBtn");

let income = Number(localStorage.getItem("budgetmate_income")) || 0;
let expenses = JSON.parse(localStorage.getItem("budgetmate_expenses")) || [];

function saveData() {
  localStorage.setItem("budgetmate_income", income);
  localStorage.setItem("budgetmate_expenses", JSON.stringify(expenses));
}

function formatMoney(value) {
  return `B$${value.toFixed(2)}`;
}

function updateDashboard() {
  const totalSpent = expenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = income - totalSpent;

  incomeDisplay.textContent = formatMoney(income);
  spentDisplay.textContent = formatMoney(totalSpent);
  remainingDisplay.textContent = formatMoney(remaining);

  if (remaining < 0) {
    remainingDisplay.style.color = "#ff4d4d";
  } else {
    remainingDisplay.style.color = "#35d07f";
  }
}

function renderExpenses() {
  expenseList.innerHTML = "";

  if (expenses.length === 0) {
    expenseList.innerHTML = `<p class="empty">No expenses added yet.</p>`;
    return;
  }

  expenses.forEach((expense, index) => {
    const item = document.createElement("div");
    item.className = "expense-item";

    item.innerHTML = `
      <div class="expense-info">
        <strong>${expense.note || expense.category}</strong>
        <span>${expense.category} • ${expense.date}</span>
        <button class="delete-btn" onclick="deleteExpense(${index})">Delete</button>
      </div>

      <div class="expense-amount">
        ${formatMoney(expense.amount)}
      </div>
    `;

    expenseList.appendChild(item);
  });
}

function deleteExpense(index) {
  expenses.splice(index, 1);
  saveData();
  updateDashboard();
  renderExpenses();
}

saveIncomeBtn.addEventListener("click", () => {
  const value = Number(incomeInput.value);

  if (!value || value < 0) {
    alert("Please enter a valid income amount.");
    return;
  }

  income = value;
  incomeInput.value = "";

  saveData();
  updateDashboard();
});

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const amount = Number(amountInput.value);
  const category = categoryInput.value;
  const note = noteInput.value.trim();

  if (!amount || amount <= 0 || !category) {
    alert("Please enter a valid expense.");
    return;
  }

  const expense = {
    amount,
    category,
    note,
    date: new Date().toLocaleDateString("en-BN")
  };

  expenses.unshift(expense);

  amountInput.value = "";
  categoryInput.value = "";
  noteInput.value = "";

  saveData();
  updateDashboard();
  renderExpenses();
});

clearBtn.addEventListener("click", () => {
  const confirmClear = confirm("Clear all expenses?");

  if (!confirmClear) return;

  expenses = [];
  saveData();
  updateDashboard();
  renderExpenses();
});

updateDashboard();
renderExpenses();