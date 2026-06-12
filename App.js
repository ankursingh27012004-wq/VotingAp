import React, { useState } from 'react';
import './App.css';
import { ethers} from 'ethers';



// Your deployed contract address (paste yours here)
const CONTRACT_ADDRESS = "0xD7ACd2a9FD159E69Bb102A1ca21C9a3e3A5F771B";

// Contract ABI (tells frontend how to talk to blockchain)
const CONTRACT_ABI = [
  "function startElection() public",
  "function endElection() public",
  "function vote(uint _candidateId) public",
  "function getCandidate(uint _candidateId) public view returns (uint, string memory, uint)",
  "function candidatesCount() public view returns (uint)",
  "function electionActive() public view returns (bool)",
  "function hasVoted(address) public view returns (bool)",
  "event VoteCast(uint candidateId)",
  "event ElectionStarted()",
  "event ElectionEnded()"
];

function App() {
  
  const [currentPage, setCurrentPage] = useState('home');
  const [walletAddress, setWalletAddress] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [electionActive, setElectionActive] = useState(false);
  const [signer, setSigner] = useState(null);
  const [provider, setProvider] = useState(null);

  const candidates = [
    { id: 1, name: 'Alice Johnson', party: 'Progressive Party', votes: 142 },
    { id: 2, name: 'Bob Smith', party: 'Unity League', votes: 98 },
    { id: 3, name: 'Clara Davis', party: 'Future First', votes: 215 },
  ];

  const connectWallet = async () => {
  if (window.ethereum) {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      setWalletAddress(address);
      setSigner(signer);
      setProvider(provider);
    } catch (error) {
      alert('Failed to connect wallet.');
    }
  } else {
    alert('Please install MetaMask!');
  }
};

  const castVote = async () => {
  if (!selectedCandidate || !walletAddress || !signer) return;
  setIsLoading(true);

  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    const tx = await contract.vote(selectedCandidate);
    await tx.wait(); // Wait for blockchain confirmation
    setHasVoted(true);
  } catch (error) {
    alert('Vote failed: ' + error.message);
  }

  setIsLoading(false);
};
  const toggleElection = async () => {
  if (!signer) return;
  
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
    if (electionActive) {
      const tx = await contract.endElection();
      await tx.wait();
    } else {
      const tx = await contract.startElection();
      await tx.wait();
    }
    setElectionActive(!electionActive);
  } catch (error) {
    alert('Error: ' + error.message);
  }
};
  const navigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="app-container">
      <nav className="navbar">
        <h2>🗳️ Blockchain Vote</h2>
        <div className="nav-links">
          <button onClick={() => navigate('home')}>Home</button>
          <button onClick={() => navigate('vote')}>Vote</button>
          <button onClick={() => navigate('results')}>Results</button>
          <button onClick={() => navigate('admin')}>Admin</button>
        </div>
        {walletAddress && <span className="wallet-badge">🟢 {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}</span>}
      </nav>

      <main className="content">
        {currentPage === 'home' && (
          <HomePage walletAddress={walletAddress} connectWallet={connectWallet} />
        )}
        {currentPage === 'vote' && (
          <VotingPage
            candidates={candidates}
            selectedCandidate={selectedCandidate}
            setSelectedCandidate={setSelectedCandidate}
            castVote={castVote}
            hasVoted={hasVoted}
            isLoading={isLoading}
            walletAddress={walletAddress}
            electionActive={electionActive}
          />
        )}
        {currentPage === 'results' && (
          <ResultsPage candidates={candidates} />
        )}
        {currentPage === 'admin' && (
          <AdminPage
            walletAddress={walletAddress}
            electionActive={electionActive}
            toggleElection={toggleElection}
            connectWallet={connectWallet}
          />
        )}
      </main>
    </div>
  );
}

function HomePage({ walletAddress, connectWallet }) {
  return (
    <div className="page">
      <h1>Welcome to the Digital Election</h1>
      <p>A secure, transparent voting system powered by blockchain.</p>
      {!walletAddress ? (
        <button className="primary-btn" onClick={connectWallet}>
          🔗 Connect Wallet
        </button>
      ) : (
        <div className="success-box">
          ✅ Wallet Connected: {walletAddress}
        </div>
      )}
    </div>
  );
}

function VotingPage({ candidates, selectedCandidate, setSelectedCandidate, castVote, hasVoted, isLoading, walletAddress, electionActive }) {
  return (
    <div className="page">
      <h1>Cast Your Vote</h1>

      {!walletAddress && <p className="warning">⚠️ Please connect your wallet on the Home page first.</p>}
      {!electionActive && walletAddress && <p className="warning">⚠️ The election is not currently active. Ask the admin to start it.</p>}

      {hasVoted ? (
        <div className="success-box">🎉 Your vote has been recorded on the blockchain. Thank you!</div>
      ) : (
        <>
          <div className="candidate-grid">
            {candidates.map((c) => (
              <div
                key={c.id}
                className={`candidate-card ${selectedCandidate === c.id ? 'selected' : ''}`}
                onClick={() => walletAddress && electionActive && setSelectedCandidate(c.id)}
              >
                <h3>{c.name}</h3>
                <p>{c.party}</p>
              </div>
            ))}
          </div>

          <button
            className="primary-btn"
            disabled={!selectedCandidate || !walletAddress || hasVoted || !electionActive}
            onClick={castVote}
          >
            {isLoading ? '⏳ Submitting to Blockchain...' : '🗳️ Submit Vote'}
          </button>
        </>
      )}
    </div>
  );
}

function ResultsPage({ candidates }) {
  return (
    <div className="page">
      <h1>Live Results</h1>
      <div className="results-list">
        {candidates.map((c) => (
          <div key={c.id} className="result-bar">
            <span className="result-name">{c.name}</span>
            <div className="bar-container">
              <div className="bar-fill" style={{ width: `${(c.votes / 500) * 100}%` }}></div>
            </div>
            <span className="result-count">{c.votes} votes</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminPage({ walletAddress, electionActive, toggleElection, connectWallet }) {
  return (
    <div className="page">
      <h1>Admin Panel</h1>
      {!walletAddress ? (
        <button className="primary-btn" onClick={connectWallet}>🔗 Connect Admin Wallet</button>
      ) : (
        <div className="admin-card">
          <p>Election Status: <strong>{electionActive ? '🟢 Active' : '🔴 Inactive'}</strong></p>
          <button onClick={toggleElection}>
            {electionActive ? 'End Election' : 'Start Election'}
          </button>
        </div>
      )}
    </div>
  );
}

export default App;