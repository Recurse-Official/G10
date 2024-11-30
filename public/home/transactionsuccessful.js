fetch("/api/transaction")
  .then((response) => response.json())
  .then((data) => {
    document.getElementById("receiverName").textContent = data.receiverName;
    document.getElementById("amountSent").textContent = data.amountSent;
    document.getElementById("transactionHash").textContent = data.transactionHash;
  })
  .catch((error) => {
    console.error("Error fetching transaction details:", error);
  });