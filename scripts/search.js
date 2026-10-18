
export function compileRegex(pattern, caseSensitive = false) {
  if (!pattern) return null;

  try {
    return new RegExp(pattern, caseSensitive ? "g" : "gi");
  } catch {
    return false;
  }
}

export function matchesExpense(expense, regex) {
  if (regex === null) return true;
  if (regex === false) return false;

  const text = [
    expense.description,
    expense.category,
    expense.date,
    expense.amount
  ].join(" ");

  // Avoid carrying the global regex's lastIndex between tests.
  regex.lastIndex = 0;
  return regex.test(text);
}

export function appendHighlightedText(element, text, pattern, caseSensitive) {
  element.replaceChildren();

  const regex = compileRegex(pattern, caseSensitive);

  if (regex === false) {
    element.textContent = text;
    return;
  }

  if (regex === null) {
    element.textContent = text;
    return;
  }

  // Use text nodes and mark elements instead of inserting raw HTML.
  const finder = new RegExp(regex.source, caseSensitive ? "g" : "gi");
  let lastIndex = 0;
  let match;

  while ((match = finder.exec(text)) !== null) {
    element.append(document.createTextNode(text.slice(lastIndex, match.index)));

    const mark = document.createElement("mark");
    mark.textContent = match[0];
    element.append(mark);

    lastIndex = match.index + match[0].length;

    if (match[0].length === 0) finder.lastIndex++;
  }

  element.append(document.createTextNode(text.slice(lastIndex)));
}
