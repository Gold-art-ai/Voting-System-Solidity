let contractABI;
let web3;
let votingContract;
let currentAccount;

// 1. Load the ABI AND detect the contract address dynamically from your network
async function loadABI() {
  try {
    const response = await fetch("/build/contracts/Voting.json");
    const contractData = await response.json();
    contractABI = contractData.abi;
    
    // Automatically detect what network Truffle deployed to (e.g., Network 5777 or 1337)
    const networkId = await web3.eth.net.getId();
    const deployedNetwork = contractData.networks[networkId];
    
    if (deployedNetwork && deployedNetwork.address) {
      return deployedNetwork.address;
    } else {
      alert("Contract not found on this local network. Did you run 'truffle migrate'?");
      return null;
    }
  } catch (err) {
    console.error("Failed to load contract compilation json artifact:", err);
    alert("Could not load contract data. Check your file pathways.");
    return null;
  }
}

// 2. Connect to MetaMask
async function connectMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" });
      web3 = new Web3(window.ethereum);
      
      const accounts = await web3.eth.getAccounts();
      currentAccount = accounts[0];
      
      // Update UI Status to show account natively
      document.getElementById("account").innerText = `Connected: ${currentAccount.substring(0, 6)}...${currentAccount.substring(38)}`;

      // Dynamic Address tracking resolution
      const detectedAddress = await loadABI();
      if (!detectedAddress) return;

      votingContract = new web3.eth.Contract(contractABI, detectedAddress);
      
      // Initial list retrieval loading sequence
      loadCandidates();
    } catch (err) {
      console.error("Connection rejection error:", err);
    }
  } else {
    alert("MetaMask extension not detected!");
  }
}

// 3. Render Candidates matching your minimalist clean white UI
async function loadCandidates() {
  if (!votingContract) return;
  try {
    const countRaw = await votingContract.methods.candidatesCount().call();
    const count = Number(countRaw); // Safely convert BigInt to Native JavaScript Number
    
    const list = document.getElementById("candidates");
    list.innerHTML = "";

    for (let i = 1; i <= count; i++) {
      const candidate = await votingContract.methods.candidates(i).call();
      
      // Safely parse properties out of Web3 structures
      const candidateName = candidate.name;
      const voteCount = candidate.voteCount.toString(); // Safely display BigInt values as strings
      
      // Construct dynamic elements using your new white elegant UI layout selectors
      const li = document.createElement("li");
      li.className = "candidate-item shadow-sm";

      li.innerHTML = `
        <span class="fw-medium">${candidateName}</span>
        <div class="d-flex align-items-center gap-3">
          <span class="vote-count-badge">${voteCount} Votes</span>
          <button class="btn btn-outline-elegant btn-sm">Vote</button>
        </div>
      `;

      // Attach voting listener to the button targeting candidate.id natively
      const button = li.querySelector("button");
      button.onclick = () => vote(Number(candidate.id));

      list.appendChild(li);
    }
  } catch (err) {
    console.error("Error parsing/loading candidates registry array:", err);
  }
}

// 4. Secure Voting Transaction Sequence
async function vote(candidateId) {
  try {
    console.log(`Casting transaction payload for Candidate ID: ${candidateId} from account ${currentAccount}`);
    
    await votingContract.methods.vote(candidateId).send({ from: currentAccount });
    
    alert("Vote successfully recorded onto block!");
    loadCandidates(); // Refresh list interface tracking
  } catch (err) {
    console.error("Reversion or signature cancel exception thrown:", err);
    alert("Transaction rejected. You may have already voted or signature was denied.");
  }
}

// 5. Add Ballot Candidate Administration Command
async function addCandidate() {
  const nameInput = document.getElementById("candidateInput");
  const name = nameInput.value.trim();
  if (!name) return alert("Please type a valid candidate name.");

  try {
    await votingContract.methods.addCandidate(name).send({ from: currentAccount });
    alert(`"${name}" successfully registered onto the ballot box.`);
    
    nameInput.value = ""; // Clear input field
    loadCandidates();     // Refresh registry tracking representation
  } catch (err) {
    console.error("Administrative transaction execution exception:", err);
    alert("Could not append candidate entry onto the smart contract state.");
  }
}