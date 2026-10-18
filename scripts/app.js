
import { loadExpenses, saveExpenses } from "./storage.js";
import { validateExpense } from "./validators.js";
import {
  compileRegex,
  matchesExpense,
  appendHighlightedText
} from "./search.js";

const $ = id => document.getElementById(id);

let expenses = loadExpenses();
let editingId = null;

const settingsKey = "studentFinanceSettings";
let settings = { currency: "USD", rate: 1450, cap: 500 };

try {
  settings = {
    ...settings,
    ...JSON.parse(localStorage.getItem(settingsKey) || "{}")
  };
} catch {
  // Use default settings if saved settings are invalid.
}

$("currency").value = settings.currency;
$("exchange-rate").value = settings.rate;
$("budget-cap").value = settings.cap;
$("date").value = new Date().toISOString().slice(0, 10);

function saveAll() {
  if (!saveExpenses(expenses)) {
    $("form-message").textContent = "Could not save data. Check browser storage.";
  }
  updateStats();
}

function saveSettings() {
  settings.currency = $("currency").value;
  settings.rate = Number($("exchange-rate").value);
  settings.cap = Number($("budget-cap").value);

  try {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  } catch (error) {
    $("settings-message").textContent = "Could not save settings.";
  }
}

function formatMoney(amount) {
  let value = amount;

  if (settings.currency === "RWF") value *= settings.rate;
  if (settings.currency === "EUR") value *= 0.92;

  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: settings.currency,
    maximumFractionDigits: settings.currency === "RWF" ? 0 : 2
  }).format(value);
}

function render() {
  const pattern = $("search").value;
  const caseSensitive = $("case-sensitive").checked;
  const regex = compileRegex(pattern, caseSensitive);

  $("search-message").textContent =
    regex === false ? "Invalid regex pattern. Check your brackets or symbols." : "";

  let visible = expenses.filter(item => matchesExpense(item, regex));

  const sort = $("sort").value;

  visible.sort((a, b) => {
    switch (sort) {
      case "date-asc": return a.date.localeCompare(b.date);
      case "description-asc": return a.description.localeCompare(b.description);
      case "description-desc": return b.description.localeCompare(a.description);
      case "amount-asc": return a.amount - b.amount;
      case "amount-desc": return b.amount - a.amount;
      default: return b.date.localeCompare(a.date);
    }
  });

  const list = $("expense-list");
  list.replaceChildren();

  for (const item of visible) {
    const row = document.createElement("tr");

    const description = document.createElement("td");
    appendHighlightedText(description, item.description, pattern, caseSensitive);

    const amount = document.createElement("td");
    amount.textContent = formatMoney(item.amount);

    const category = document.createElement("td");
    category.textContent = item.category;

    const date = document.createElement("td");
    date.textContent = item.date;

    const actions = document.createElement("td");

    const edit = document.createElement("button");
    edit.textContent = "Edit";
    edit.type = "button";
    edit.addEventListener("click", () => {
      editingId = item.id;
      $("description").value = item.description;
      $("amount").value = item.amount;
      $("category").value = item.category;
      $("date").value = item.date;
      $("add-expense").scrollIntoView({ behavior: "smooth" });
      $("description").focus();
      $("form-message").textContent = "Editing expense. Submit to save changes.";
    });

    const remove = document.createElement("button");
    remove.textContent = "Delete";
    remove.type = "button";
    remove.addEventListener("click", () => {
      if (!confirm(`Delete "${item.description}"?`)) return;

      expenses = expenses.filter(expense => expense.id !== item.id);
      if (editingId === item.id) editingId = null;
      saveAll();
      render();
    });

    actions.append(edit, remove);
    row.append(description, amount, category, date, actions);
    list.append(row);
  }

  if (visible.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 5;
    cell.textContent = "No matching expenses found.";
    row.append(cell);
    list.append(row);
  }

  updateStats();
}

function updateStats() {
  const total = expenses.reduce((sum, item) => sum + item.amount, 0);

  $("total-records").textContent = expenses.length;
  $("total-spent").textContent = formatMoney(total);

  const totals = {};
  expenses.forEach(item => {
    totals[item.category] = (totals[item.category] || 0) + item.amount;
  });

  const top = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
  $("top-category").textContent = top ? top[0] : "None";

  const cap = Number($("budget-cap").value);
  const status = $("budget-status");

  if (total > cap) {
    status.textContent = `Budget exceeded by ${formatMoney(total - cap)}.`;
    status.setAttribute("aria-live", "assertive");
  } else {
    status.textContent = `${formatMoney(cap - total)} remaining in your budget.`;
    status.setAttribute("aria-live", "polite");
  }

  drawWeeklyChart();
}

function drawWeeklyChart() {
  const chart = $("weekly-chart");
  chart.replaceChildren();

  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - i);
    const key = date.toISOString().slice(0, 10);

    const total = expenses
      .filter(item => item.date === key)
      .reduce((sum, item) => sum + item.amount, 0);

    days.push({ key, label: key.slice(5), total });
  }

  const max = Math.max(1, ...days.map(day => day.total));

  for (const day of days) {
    const bar = document.createElement("div");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max(8, day.total / max * 100)}px`;
    bar.textContent = day.label;
    bar.title = `${day.key}: ${formatMoney(day.total)}`;
    bar.setAttribute("aria-label", `${day.key}: ${formatMoney(day.total)}`);
    chart.append(bar);
  }
}

$("expense-form").addEventListener("submit", event => {
  event.preventDefault();

  const description = $("description").value;
  const amountText = $("amount").value;
  const category = $("category").value;
  const date = $("date").value;

  const errors = validateExpense(description, amountText, category, date);

  if (errors.length) {
    $("form-message").textContent = errors.join(" ");
    return;
  }

  const now = new Date().toISOString();

  if (editingId) {
    const existing = expenses.find(item => item.id === editingId);

    if (existing) {
      Object.assign(existing, {
        description,
        amount: Number(amountText),
        category,
        date,
        updatedAt: now
      });
    }
    editingId = null;
  } else {
    expenses.push({
      id: `rec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      description,
      amount: Number(amountText),
      category,
      date,
      createdAt: now,
      updatedAt: now
    });
  }

  saveAll();
  $("form-message").textContent = "Expense saved successfully.";
  $("expense-form").reset();
  $("date").value = new Date().toISOString().slice(0, 10);
  render();
});

$("expense-form").addEventListener("reset", () => {
  editingId = null;
});

$("search").addEventListener("input", render);
$("case-sensitive").addEventListener("change", render);
$("sort").addEventListener("change", render);

$("currency").addEventListener("change", () => {
  saveSettings();
  render();
});

$("exchange-rate").addEventListener("change", () => {
  if (Number($("exchange-rate").value) <= 0) {
    $("settings-message").textContent = "Exchange rate must be greater than zero.";
    return;
  }
  saveSettings();
  render();
});

$("budget-cap").addEventListener("change", () => {
  if (Number($("budget-cap").value) < 0) {
    $("settings-message").textContent = "Budget cannot be negative.";
    return;
  }
  saveSettings();
  updateStats();
});

$("export-json").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(expenses, null, 2)], {
    type: "application/json"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-finance-expenses.json";
  link.click();
  URL.revokeObjectURL(url);
  $("settings-message").textContent = "Export started.";
});

$("import-json").addEventListener("change", async event => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    const imported = JSON.parse(await file.text());

    const valid = Array.isArray(imported) && imported.every(item =>
      item &&
      typeof item.id === "string" &&
      typeof item.description === "string" &&
      item.description.trim() === item.description &&
      item.description.length > 0 &&
      Number.isFinite(item.amount) &&
      item.amount > 0 &&
      typeof item.category === "string" &&
      typeof item.date === "string" &&
      /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      !Number.isNaN(Date.parse(item.date)) &&
      typeof item.createdAt === "string" &&
      typeof item.updatedAt === "string"
    );

    const ids = valid ? imported.map(item => item.id) : [];

    if (!valid || new Set(ids).size !== ids.length) {
      throw new Error("Invalid records or duplicate IDs.");
    }

    if (!saveExpenses(imported)) {
      throw new Error("Could not save imported data.");
    }

    expenses = imported;
    render();
    $("settings-message").textContent = "Import successful.";
  } catch (error) {
    $("settings-message").textContent = `Import failed: ${error.message}`;
  } finally {
    event.target.value = "";
  }
});

$("clear-data").addEventListener("click", () => {
  if (!confirm("Delete all expenses? This cannot be undone.")) return;

  expenses = [];
  editingId = null;
  saveAll();
  render();
  $("settings-message").textContent = "All expenses cleared.";
});

render();

