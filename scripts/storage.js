
const STORAGE_KEY = "studentFinanceExpenses";

export function loadExpenses() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];

    const data = JSON.parse(saved);

    if (!Array.isArray(data)) return [];

    return data.filter(item =>
      item &&
      typeof item.id === "string" &&
      typeof item.description === "string" &&
      Number.isFinite(item.amount) &&
      typeof item.category === "string" &&
      typeof item.date === "string"
    );
  } catch (error) {
    console.error("Could not load expenses:", error);
    return [];
  }
}

export function saveExpenses(expenses) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    return true;
  } catch (error) {
    console.error("Could not save expenses:", error);
    return false;
  }
}
