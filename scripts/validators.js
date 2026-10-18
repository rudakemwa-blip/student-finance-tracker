export function validateExpense(description, amountText, category, date) {
  const errors = [];
  if (typeof description !== "string" || !description.trim()) {
    errors.push("Description is required.");
  } else if (description.trim() !== description) {
    errors.push("Description cannot start or end with spaces.");
  }
  if (amountText === "" || !Number.isFinite(Number(amountText)) || Number(amountText) <= 0) {
    errors.push("Amount must be a number greater than zero.");
  }
  if (typeof category !== "string" || !category.trim()) {
    errors.push("Category is required.");
  }
  if (typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date)) ||
      new Date(date + "T00:00:00Z").toISOString().slice(0, 10) !== date) {
    errors.push("Enter a valid date.");
  }
  return errors;
}
