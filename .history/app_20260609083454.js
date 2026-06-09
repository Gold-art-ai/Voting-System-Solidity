const contractAddress = "0xd52965abb68c05fb41e1da9fffe0970deb9d8bb3";
let contractABI;
let web3;
let votingContract;

async function loadABI() {
  try{
  const response = await fetch("/build/contracts/Voting.json");
  contractABI = await response.json();
  console.log(contractABI);
} catch(err){
  console.error("failed to load ABI",err);
  alert("could not load contract ABI check path");

}
}
async function connectMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    web3 = new Web3(window.ethereum);
    const accounts = await web3.eth.getAccounts();
    document.getElementById("account").innerText = `Connected Account: ${accounts[0]}`;

    if (!contractABI) await loadABI();
    votingContract = new web3.eth.Contract(contractABI.abi, contractAddress);
    loadCandidates(votingContract, accounts[0]);
  } else {
    alert("MetaMask not detected!");
  }
}

async function loadCandidates(contract, account) {
  try {
    const count = await contract.methods.candidatesCount().call();
    const list = document.getElementById("candidates");
    list.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const candidate = await contract.methods.candidates(i).call();
      const li = document.createElement("li");
      li.className = "list-group-item d-flex justify-content-between align-items-center";

      li.innerHTML = `
        <span><strong>${candidate.name}</strong> – ${candidate.voteCount} votes</span>
        <button class="btn btn-outline-primary btn-sm">Vote</button>
      `;

      const button = li.querySelector("button");
      button.onclick = () => vote(contract, account, i);

      list.appendChild(li);
    }
  } catch (err) {
    console.error("Error loading candidates:", err);
    alert("Error loading candidates. Check console.");
  }
}


async function vote(contract, account, candidateId) {
  try {
    await contract.methods.vote(candidateId).send({ from: account });
    alert("Vote successfully cast!");
    loadCandidates(contract, account);
  } catch (err) {
    alert("Transaction failed or already voted.");
  }
}
async function addCandidate() {
  const name = document.getElementById("candidateInput").value;
  if (!name) return alert("Please enter a candidate name");

  const accounts = await web3.eth.getAccounts();
  try {
    await votingContract.methods.addCandidate(name).send({ from: accounts[0] });
    alert("Candidate added successfully");
    loadCandidates(votingContract, accounts[0]); // Refresh list
  } catch (err) {
    console.error("Error adding candidate:", err);
    alert("Could not add candidate.");
  }
}



