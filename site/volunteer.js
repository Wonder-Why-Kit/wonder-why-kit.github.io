// No submission destination is configured. Never send preview data or navigate
// with personal information in a query string, including implicit Enter submits.
document
  .querySelector("#volunteer-form")
  .addEventListener("submit", (event) => {
    event.preventDefault();
  });
