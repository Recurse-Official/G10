document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector("nav form .form-input input");
  const resultsContainer = document.querySelector(".results-container");
  const resultsList = document.getElementById("results");

  // Create results list if it doesn't exist
  if (!resultsList) {
    const list = document.createElement("ul");
    list.id = "results";
    resultsContainer.appendChild(list);
  }

  searchInput.addEventListener("input", async function () {
    const query = this.value.trim();

    // Clear previous results
    resultsList.innerHTML = "";

    // Hide results container if query is empty
    if (query.length < 2) {
      resultsContainer.classList.remove("show");
      return;
    }

    try {
      // Show loading state
      resultsContainer.classList.add("show");
      resultsList.innerHTML = '<li class="loading">Searching...</li>';

      // Fetch search results
      const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
      const results = await response.json();

      // Clear loading state
      resultsList.innerHTML = "";

      if (results.length === 0) {
        resultsList.innerHTML = '<li class="no-results">No results found</li>';
        return;
      }

      // Populate results
      results.forEach((user) => {
        const li = document.createElement("li");
        li.textContent = `${user.fname} ${user.lname} (${user.rollno})`;

        li.addEventListener("click", function () {
          // Redirect to payment page with receiver's first name
          window.location.href = `/payment?receiver=${encodeURIComponent(
            user.fname
          )}`;
        });
        resultsList.appendChild(li);
      });

      resultsContainer.classList.add("show");
    } catch (error) {
      console.error("Search error:", error);
      resultsList.innerHTML = '<li class="no-results">Error searching</li>';
    }
  });

  // Close results when clicking outside
  document.addEventListener("click", function (event) {
    if (
      !resultsContainer.contains(event.target) &&
      event.target !== searchInput
    ) {
      resultsContainer.classList.remove("show");
    }
  });
});
