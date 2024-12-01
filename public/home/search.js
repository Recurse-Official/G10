document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("nav form .form-input input");
    const resultsContainer = document.querySelector(".results-container");
    const resultsList = document.getElementById("results");

    if (!resultsList) {
        const list = document.createElement("ul");
        list.id = "results";
        resultsContainer.appendChild(list);
    }

    searchInput.addEventListener("input", async function () {
        const query = this.value.trim();
        resultsList.innerHTML = "";
        
        if (query.length < 2) {
            resultsContainer.classList.remove("show");
            return;
        }

        try {
            resultsContainer.classList.add("show");
            resultsList.innerHTML = '<li class="loading">Searching...</li>';
            
            const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
           
            if (!response.ok) {
                throw new Error('Search failed');
            }
           
            const results = await response.json();
            resultsList.innerHTML = "";
            
            if (results.length === 0) {
                resultsList.innerHTML = '<li class="no-results">No results found</li>';
                return;
            }

            results.forEach((user) => {
                const li = document.createElement("li");
                li.textContent = `${user.fname} ${user.lname} (${user.rollno})`;
               
                li.addEventListener("click", function () {
                    // Redirect to payment page with receiver's name as a query parameter
                    window.location.href = `/payment?receiver=${encodeURIComponent(user.fname)}`;
                });
               
                resultsList.appendChild(li);
            });
            
            resultsContainer.classList.add("show");
        } catch (error) {
            console.error("Search error:", error);
            resultsList.innerHTML = '<li class="no-results">Error searching</li>';
        }
    });

    document.addEventListener("click", function (event) {
        if (
            !resultsContainer.contains(event.target) &&
            event.target !== searchInput
        ) {
            resultsContainer.classList.remove("show");
        }
    });
});