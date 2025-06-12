import React from 'react';

export default function Content({ result, assetType, user }) {
  if (!result) return null;

  const insurancePrice = (assetType === 'contract' || assetType === 'app') ? 2000 : 500;

  const shareOnTwitter = () => {
    const text = `QuantumSafe scan result for (${assetType}): ${result.quantumRisk}\nAsset: ${result.asset}\nScan by QuantumSafe: ${window.location.origin}/login?ref=${user?.id}`;
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div style={{ marginTop: 24, border: '1px solid #eee', padding: 16, borderRadius: 8 }}>
      <h3>Scan Result: {assetType.charAt(0).toUpperCase() + assetType.slice(1)}</h3>
      <p><strong>Asset Address / Data:</strong> {result.asset}</p>
      <p>
        <strong>Quantum Threat Level:</strong>{' '}
        <span style={{ color: result.quantumRisk === 'High' ? 'red' : 'green', fontWeight: 'bold' }}>
          {result.quantumRisk}
        </span>
      </p>
      <h4>Vulnerabilities Detected:</h4>
      <ul>
        {result.details.map((d, i) => (
          <li key={i}>
            <strong>{d.vuln}:</strong> {d.risk}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 20 }}>
        <button style={{ marginRight: 12 }} onClick={shareOnTwitter}>
          Share Results on Twitter
        </button>
        <button>
          Insure this Asset (${insurancePrice})
        </button>
      </div>
    </div>
  );
}