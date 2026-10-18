# Student Finance Tracker

A responsive browser-based application for tracking student spending, managing budgets, and finding transactions using regular expressions (regex).

## Features
- Add, edit, and delete expenses.
- Validate descriptions, amounts, categories, and dates.
- Save expenses and settings in browser local storage.
- Search expense descriptions, categories, dates, and amounts using regex.
- Toggle case-sensitive search and highlight matches.
- Sort records by date, description, or amount.
- View spending totals, top category, budget status, and a seven-day chart.
- Configure currency, exchange rate, and budget cap.
- Import and export expense records as JSON.
- Clear stored expenses when needed.

## Project structure
- `Index.html` — application interface.
- `styles/style.css` — page styling.
- `scripts/app.js` — application logic and rendering.
- `scripts/search.js` — regex search and highlighting.
- `scripts/storage.js` — local storage helpers.
- `scripts/validators.js` — expense validation.
- `seed.json` — ten sample expense records.
- `tests.html` — browser-based tests.

## Run the application
1. Open the project folder in Visual Studio Code.
2. Open `Index.html` using the Live Server extension, or serve the folder through a local HTTP server.
3. Add expenses using the form. Data is saved in the browser's local storage.
4. To load the sample records, use the application's JSON import control and select `seed.json`.

## Search examples
- `Food` — find records containing Food.
- `^Bus` — descriptions or fields beginning with Bus.
- `fare|Taxi` — find either term.
- `\d{4}` — find four consecutive digits.
- `[` — deliberately invalid pattern; the app should display an error.

Search uses JavaScript regular expressions. Use patterns carefully; invalid patterns are reported instead of crashing the app.

## Tests
Open `tests.html` through Live Server to run the automated browser checks. The tests cover validation, regex compilation, matching, and invalid patterns.

## Data and privacy
Records are stored in the browser's local storage on the current browser and device. Export important data before clearing browser storage. Currency conversion uses the exchange rate entered by the user and is an estimate, not a live market rate.
