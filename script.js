document.addEventListener("DOMContentLoaded", () => {
  const categories = [
    "Food", "Fuel", "Car", "Shopping",
    "Subscriptions", "Entertainment", "Savings", "Other"
  ];

  let currentDate = new Date();
  let currentMonthKey = getMonthKey(currentDate);

  let incomeData = JSON.parse(localStorage.getItem("budgetmate_incomeData")) || {};
  let expenses = JSON.parse(localStorage.getItem("budgetmate_expenses")) || [];
  let categoryBudgets = JSON.parse(localStorage.getItem("budgetmate_categoryBudgets")) || {};
  let savingsGoal = JSON.parse(localStorage.getItem("budgetmate_savingsGoal")) || null;
  let recurringExpenses = JSON.parse(localStorage.getItem("budgetmate_recurringExpenses")) || [];

  const $ = (id) => document.getElementById(id);

  function getMonthKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }

  function getMonthName(date) {
    return date.toLocaleDateString("en-BN", { month: "long", year: "numeric" });
  }

  function saveData() {
    localStorage.setItem("budgetmate_incomeData", JSON.stringify(incomeData));
    localStorage.setItem("budgetmate_expenses", JSON.stringify(expenses));
    localStorage.setItem("budgetmate_categoryBudgets", JSON.stringify(categoryBudgets));
    localStorage.setItem("budgetmate_savingsGoal", JSON.stringify(savingsGoal));
    localStorage.setItem("budgetmate_recurringExpenses", JSON.stringify(recurringExpenses));
  }

  function formatMoney(value) {
    return `B$${Number(value || 0).toFixed(2)}`;
  }

  function getCurrentIncome() {
    return Number(incomeData[currentMonthKey]) || 0;
  }

  function getCurrentExpenses() {
    return expenses.filter((expense) => expense.monthKey === currentMonthKey);
  }

  function getTotalSpent() {
    return getCurrentExpenses().reduce((sum, item) => sum + Number(item.amount), 0);
  }

  function getCategorySpent(category) {
    return getCurrentExpenses()
      .filter((expense) => expense.category === category)
      .reduce((sum, item) => sum + Number(item.amount), 0);
  }

  function getBiggestExpense() {
    const current = getCurrentExpenses();
    if (current.length === 0) return null;
    return current.reduce((biggest, item) => item.amount > biggest.amount ? item : biggest, current[0]);
  }

  function getTopCategory() {
    let top = { category: "None", amount: 0 };

    categories.forEach((category) => {
      const spent = getCategorySpent(category);
      if (spent > top.amount) {
        top = { category, amount: spent };
      }
    });

    return top;
  }

  function refreshApp() {
    updateMonthDisplay();
    updateDashboard();
    renderInsights();
    renderCategoryBudgets();
    renderBreakdown();
    renderExpenses();
    renderGoal();
    renderRecurring();
  }

  function updateMonthDisplay() {
    $("monthDisplay").textContent = getMonthName(currentDate);
  }

  function updateDashboard() {
    const income = getCurrentIncome();
    const totalSpent = getTotalSpent();
    const remaining = income - totalSpent;
    const percentage = income > 0 ? (totalSpent / income) * 100 : 0;

    $("incomeDisplay").textContent = formatMoney(income);
    $("spentDisplay").textContent = formatMoney(totalSpent);
    $("remainingDisplay").textContent = formatMoney(remaining);
    $("remainingDisplay").style.color = remaining < 0 ? "#ff4d4d" : "#35d07f";

    $("monthlyProgressBar").style.width = `${Math.min(percentage, 100)}%`;
    $("monthlyProgressText").textContent = `${percentage.toFixed(0)}% of income used`;

    if (percentage >= 100) {
      $("monthlyProgressBar").style.background = "#ff4d4d";
    } else if (percentage >= 80) {
      $("monthlyProgressBar").style.background = "#ffcc66";
    } else {
      $("monthlyProgressBar").style.background = "#35d07f";
    }

    const warningBox = $("warningBox");
    warningBox.classList.add("hidden");
    warningBox.textContent = "";

    if (income > 0 && remaining < 0) {
      warningBox.classList.remove("hidden");
      warningBox.textContent = "You have exceeded your monthly income.";
    } else if (income > 0 && percentage >= 80) {
      warningBox.classList.remove("hidden");
      warningBox.textContent = "Warning: You have used 80% or more of your monthly income.";
    }
  }

  function renderInsights() {
    const list = $("insightList");
    const income = getCurrentIncome();
    const totalSpent = getTotalSpent();
    const remaining = income - totalSpent;
    const currentExpenses = getCurrentExpenses();

    const topCategory = getTopCategory();
    const biggest = getBiggestExpense();

    const regretTotal = currentExpenses
      .filter((expense) => expense.worth === "regret")
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const worthTotal = currentExpenses
      .filter((expense) => expense.worth === "worth")
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    let advice = "Add income and expenses to generate advice.";

    if (income > 0 && totalSpent === 0) {
      advice = "Good start. You have not spent anything this month yet.";
    } else if (remaining < 0) {
      advice = "You are overspending this month. Pause non-essential spending first.";
    } else if (income > 0 && totalSpent >= income * 0.8) {
      advice = "You are close to your income limit. Reduce shopping, entertainment, or non-urgent costs.";
    } else if (income > 0 && totalSpent < income * 0.5) {
      advice = "Your spending is controlled. Consider increasing savings if possible.";
    } else {
      advice = "Your spending is still manageable. Keep monitoring the top category.";
    }

    list.innerHTML = `
      <div class="insight-card">
        <strong>Top Category</strong>
        <p class="category-meta">${topCategory.category}: ${formatMoney(topCategory.amount)}</p>
      </div>

      <div class="insight-card">
        <strong>Biggest Purchase</strong>
        <p class="category-meta">
          ${biggest ? `${biggest.note || biggest.category}: ${formatMoney(biggest.amount)}` : "No purchase yet"}
        </p>
      </div>

      <div class="insight-card">
        <strong>Worth It vs Regret</strong>
        <p class="category-meta">Worth it: ${formatMoney(worthTotal)} • Regret: ${formatMoney(regretTotal)}</p>
      </div>

      <div class="insight-card">
        <strong>Monthly Advice</strong>
        <p class="category-meta">${advice}</p>
      </div>
    `;
  }

  function renderCategoryBudgets() {
    $("categoryBudgetList").innerHTML = "";

    categories.forEach((category) => {
      const budget = Number(categoryBudgets[category]) || 0;
      const spent = getCategorySpent(category);
      const percentage = budget > 0 ? (spent / budget) * 100 : 0;
      const remaining = budget - spent;
      const isOverBudget = budget > 0 && spent > budget;

      const card = document.createElement("div");
      card.className = `category-card ${isOverBudget ? "over-budget" : ""}`;

      card.innerHTML = `
        <div class="category-top">
          <strong>${category}</strong>
          <span>${formatMoney(spent)} / ${formatMoney(budget)}</span>
        </div>
        <p class="category-meta">
          ${budget > 0 ? `${formatMoney(remaining)} remaining • ${percentage.toFixed(0)}% used` : "No budget set yet"}
        </p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(percentage, 100)}%"></div>
        </div>
      `;

      $("categoryBudgetList").appendChild(card);
    });
  }

  function renderBreakdown() {
    $("breakdownList").innerHTML = "";

    if (getCurrentExpenses().length === 0) {
      $("breakdownList").innerHTML = `<p class="empty">No spending breakdown yet.</p>`;
      return;
    }

    categories.forEach((category) => {
      const spent = getCategorySpent(category);
      if (spent <= 0) return;

      const card = document.createElement("div");
      card.className = "breakdown-card";

      card.innerHTML = `
        <div class="breakdown-top">
          <strong>${category}</strong>
          <span>${formatMoney(spent)}</span>
        </div>
      `;

      $("breakdownList").appendChild(card);
    });
  }

  function renderExpenses() {
    $("expenseList").innerHTML = "";

    const currentExpenses = getCurrentExpenses();

    if (currentExpenses.length === 0) {
      $("expenseList").innerHTML = `<p class="empty">No expenses added for this month.</p>`;
      return;
    }

    currentExpenses.forEach((expense) => {
      const item = document.createElement("div");
      item.className = "expense-item";

      let badgeClass = "badge-neutral";
      let badgeText = "Neutral";

      if (expense.worth === "worth") {
        badgeClass = "badge-worth";
        badgeText = "Worth it";
      }

      if (expense.worth === "regret") {
        badgeClass = "badge-regret";
        badgeText = "Regret";
      }

      item.innerHTML = `
        <div class="expense-info">
          <strong>${expense.note || expense.category}</strong>
          <span>${expense.category} • ${expense.date}</span>
          <div class="badge ${badgeClass}">${badgeText}</div>
          ${expense.receipt ? `<img class="receipt-thumb" src="${expense.receipt}" alt="Receipt" />` : ""}
          <button class="delete-btn" data-id="${expense.id}" type="button">Delete</button>
        </div>
        <div class="expense-amount">${formatMoney(expense.amount)}</div>
      `;

      $("expenseList").appendChild(item);
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        expenses = expenses.filter((expense) => expense.id !== btn.dataset.id);
        saveData();
        refreshApp();
      });
    });
  }

  function renderGoal() {
    const box = $("goalBox");
    box.innerHTML = "";

    if (!savingsGoal) {
      box.innerHTML = `<p class="empty">No savings goal added yet.</p>`;
      return;
    }

    const percentage = savingsGoal.target > 0
      ? (savingsGoal.saved / savingsGoal.target) * 100
      : 0;

    box.innerHTML = `
      <div class="goal-card">
        <div class="goal-top">
          <strong>${savingsGoal.name}</strong>
          <span>${formatMoney(savingsGoal.saved)} / ${formatMoney(savingsGoal.target)}</span>
        </div>
        <p class="category-meta">${percentage.toFixed(0)}% completed</p>
        <div class="progress-track">
          <div class="progress-fill" style="width:${Math.min(percentage, 100)}%"></div>
        </div>
      </div>
    `;
  }

  function renderRecurring() {
    $("recurringList").innerHTML = "";

    if (recurringExpenses.length === 0) {
      $("recurringList").innerHTML = `<p class="empty">No recurring expenses yet.</p>`;
      return;
    }

    recurringExpenses.forEach((item) => {
      const card = document.createElement("div");
      card.className = "recurring-card";

      card.innerHTML = `
        <div class="recurring-top">
          <strong>${item.name}</strong>
          <span>${formatMoney(item.amount)}</span>
        </div>
        <p class="category-meta">${item.category}</p>
        <button class="delete-btn recurring-delete" data-id="${item.id}" type="button">Delete</button>
      `;

      $("recurringList").appendChild(card);
    });

    document.querySelectorAll(".recurring-delete").forEach((btn) => {
      btn.addEventListener("click", () => {
        recurringExpenses = recurringExpenses.filter((item) => item.id !== btn.dataset.id);
        saveData();
        refreshApp();
      });
    });
  }

  function getReceiptData(callback) {
    const file = $("receiptInput").files[0];

    if (!file) {
      callback("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => callback(reader.result);
    reader.readAsDataURL(file);
  }

  $("receiptInput").addEventListener("change", () => {
    const file = $("receiptInput").files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      $("receiptPreview").src = reader.result;
      $("receiptPreview").classList.remove("hidden");
    };

    reader.readAsDataURL(file);
  });

  $("saveIncomeBtn").addEventListener("click", () => {
    const value = Number($("incomeInput").value);

    if (isNaN(value) || value <= 0) {
      alert("Please enter a valid income amount.");
      return;
    }

    incomeData[currentMonthKey] = value;
    $("incomeInput").value = "";

    saveData();
    refreshApp();
  });

  $("expenseForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const amount = Number($("amountInput").value);
    const category = $("categoryInput").value;
    const note = $("noteInput").value.trim();
    const worth = $("worthInput").value;

    if (isNaN(amount) || amount <= 0 || category === "") {
      alert("Please enter a valid expense.");
      return;
    }

    getReceiptData((receipt) => {
      expenses.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
        amount,
        category,
        note,
        worth,
        receipt,
        date: new Date().toLocaleDateString("en-BN"),
        monthKey: currentMonthKey
      });

      $("amountInput").value = "";
      $("categoryInput").value = "";
      $("noteInput").value = "";
      $("worthInput").value = "neutral";
      $("receiptInput").value = "";
      $("receiptPreview").src = "";
      $("receiptPreview").classList.add("hidden");

      saveData();
      refreshApp();
    });
  });

  $("buyForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const name = $("buyNameInput").value.trim();
    const price = Number($("buyPriceInput").value);
    const need = Number($("buyNeedInput").value);
    const urgency = Number($("buyUrgencyInput").value);
    const remaining = getCurrentIncome() - getTotalSpent();

    if (!name || price <= 0 || !need || !urgency) {
      alert("Please complete the purchase calculator.");
      return;
    }

    let decision = "Wait";
    let reason = "This purchase may be better delayed.";

    if (price > remaining && remaining > 0) {
      decision = "Wait";
      reason = "The item costs more than your remaining monthly balance.";
    } else if (need >= 4 && urgency >= 4) {
      decision = "Buy";
      reason = "This looks important and urgent.";
    } else if (need >= 4 && price <= remaining * 0.5) {
      decision = "Consider Buying";
      reason = "It seems useful and still fits within your remaining balance.";
    } else if (need <= 2 && urgency <= 2) {
      decision = "Do Not Buy";
      reason = "This looks more like a want than a need.";
    }

    $("buyResult").innerHTML = `
      <strong>${decision}: ${name}</strong>
      <p class="category-meta">Price: ${formatMoney(price)}</p>
      <p class="category-meta">${reason}</p>
    `;
  });

  $("goalForm").addEventListener("submit", (e) => {
    e.preventDefault();

    savingsGoal = {
      name: $("goalNameInput").value.trim(),
      target: Number($("goalTargetInput").value),
      saved: Number($("goalSavedInput").value)
    };

    if (!savingsGoal.name || savingsGoal.target <= 0 || savingsGoal.saved < 0) {
      alert("Please enter a valid savings goal.");
      return;
    }

    $("goalNameInput").value = "";
    $("goalTargetInput").value = "";
    $("goalSavedInput").value = "";

    saveData();
    refreshApp();
  });

  $("recurringForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const item = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: $("recurringNameInput").value.trim(),
      amount: Number($("recurringAmountInput").value),
      category: $("recurringCategoryInput").value
    };

    if (!item.name || item.amount <= 0 || !item.category) {
      alert("Please enter a valid recurring expense.");
      return;
    }

    recurringExpenses.unshift(item);

    $("recurringNameInput").value = "";
    $("recurringAmountInput").value = "";
    $("recurringCategoryInput").value = "";

    saveData();
    refreshApp();
  });

  $("applyRecurringBtn").addEventListener("click", () => {
    if (recurringExpenses.length === 0) {
      alert("No recurring expenses to apply.");
      return;
    }

    recurringExpenses.forEach((item) => {
      expenses.unshift({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        amount: item.amount,
        category: item.category,
        note: item.name,
        worth: "neutral",
        receipt: "",
        date: new Date().toLocaleDateString("en-BN"),
        monthKey: currentMonthKey
      });
    });

    saveData();
    refreshApp();
  });

  $("budgetForm").addEventListener("submit", (e) => {
    e.preventDefault();

    const category = $("budgetCategoryInput").value;
    const amount = Number($("budgetAmountInput").value);

    if (!category || isNaN(amount) || amount < 0) {
      alert("Please enter a valid category budget.");
      return;
    }

    categoryBudgets[category] = amount;

    $("budgetCategoryInput").value = "";
    $("budgetAmountInput").value = "";

    saveData();
    refreshApp();
  });

  $("prevMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    currentMonthKey = getMonthKey(currentDate);
    refreshApp();
  });

  $("nextMonthBtn").addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    currentMonthKey = getMonthKey(currentDate);
    refreshApp();
  });

  $("clearMonthBtn").addEventListener("click", () => {
    if (!confirm("Clear all expenses for this month?")) return;

    expenses = expenses.filter((expense) => expense.monthKey !== currentMonthKey);
    saveData();
    refreshApp();
  });

  $("exportReportBtn").addEventListener("click", () => {
    const topCategory = getTopCategory();
    const biggest = getBiggestExpense();

    const regretTotal = getCurrentExpenses()
      .filter((expense) => expense.worth === "regret")
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const worthTotal = getCurrentExpenses()
      .filter((expense) => expense.worth === "worth")
      .reduce((sum, expense) => sum + Number(expense.amount), 0);

    const report = `
BudgetMate Smart Monthly Report
Month: ${getMonthName(currentDate)}

Income: ${formatMoney(getCurrentIncome())}
Spent: ${formatMoney(getTotalSpent())}
Remaining: ${formatMoney(getCurrentIncome() - getTotalSpent())}

Top Category:
${topCategory.category}: ${formatMoney(topCategory.amount)}

Biggest Purchase:
${biggest ? `${biggest.note || biggest.category}: ${formatMoney(biggest.amount)}` : "None"}

Worth It vs Regret:
Worth it: ${formatMoney(worthTotal)}
Regret: ${formatMoney(regretTotal)}

Breakdown:
${categories.map((cat) => `${cat}: ${formatMoney(getCategorySpent(cat))}`).join("\n")}

Expenses:
${getCurrentExpenses().map((e) => `${e.date} - ${e.category} - ${formatMoney(e.amount)} - ${e.note || "No note"} - ${e.worth || "neutral"}`).join("\n")}
    `;

    const blob = new Blob([report], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `BudgetMate-Smart-${currentMonthKey}.txt`;
    link.click();

    URL.revokeObjectURL(url);
  });

  refreshApp();
});
