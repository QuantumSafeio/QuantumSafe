import React from 'react';

export default function ScanResult({ result, assetType, user }) {
  if (!result) return null;

  const insurancePrice = (assetType === 'contract' || assetType === 'app') ? 2000 : 500;

  const shareOnTwitter = () => {
    const text = `🛡️ نتيجة فحص QuantumSafe لـ ${assetType}:
    
🎯 مستوى التهديد الكمي: ${result.quantumRisk}
🔍 الأصل: ${result.asset}
    
تم الفحص بواسطة QuantumSafe 🚀
${window.location.origin}/login?ref=${user?.id}

#QuantumSafe #BlockchainSecurity #QuantumThreat`;
    
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank');
  };

  const getRiskColor = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return '#ff4757';
      case 'medium': return '#ffa502';
      case 'low': return '#2ed573';
      default: return '#747d8c';
    }
  };

  const getRiskEmoji = (risk) => {
    switch (risk.toLowerCase()) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '✅';
      default: return '❓';
    }
  };

  return (
    <div style={{
      marginTop: '30px',
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: '20px',
      padding: '25px',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <h3 style={{
        marginBottom: '20px',
        color: '#00f5ff',
        fontSize: '1.5rem'
      }}>
        📊 نتيجة الفحص: {assetType.charAt(0).toUpperCase() + assetType.slice(1)}
      </h3>

      <div style={{
        background: 'rgba(0, 0, 0, 0.3)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong style={{ color: '#ffffff' }}>🎯 عنوان الأصل:</strong>
          <div style={{
            marginTop: '5px',
            padding: '10px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            fontFamily: 'monospace',
            fontSize: '14px',
            wordBreak: 'break-all'
          }}>
            {result.asset}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '20px'
        }}>
          <strong style={{ color: '#ffffff' }}>⚡ مستوى التهديد الكمي:</strong>
          <span style={{
            color: getRiskColor(result.quantumRisk),
            fontWeight: 'bold',
            fontSize: '1.2rem',
            padding: '5px 15px',
            background: `${getRiskColor(result.quantumRisk)}20`,
            borderRadius: '20px',
            border: `2px solid ${getRiskColor(result.quantumRisk)}`
          }}>
            {getRiskEmoji(result.quantumRisk)} {result.quantumRisk}
          </span>
        </div>
      </div>

      <div style={{
        background: 'rgba(255, 0, 0, 0.1)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '25px',
        border: '1px solid rgba(255, 0, 0, 0.3)'
      }}>
        <h4 style={{
          color: '#ff4757',
          marginBottom: '15px',
          fontSize: '1.2rem'
        }}>
          🔍 الثغرات المكتشفة:
        </h4>
        <div style={{ display: 'grid', gap: '12px' }}>
          {result.details.map((detail, index) => (
            <div
              key={index}
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '15px',
                borderLeft: `4px solid ${getRiskColor(detail.risk)}`
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px'
              }}>
                <strong style={{ color: '#ffffff' }}>{detail.vuln}</strong>
                <span style={{
                  color: getRiskColor(detail.risk),
                  fontWeight: 'bold',
                  fontSize: '0.9rem'
                }}>
                  {getRiskEmoji(detail.risk)} {detail.risk}
                </span>
              </div>
              <p style={{
                margin: 0,
                opacity: 0.8,
                fontSize: '14px',
                lineHeight: '1.4'
              }}>
                {detail.description || 'تم اكتشاف ثغرة أمنية تتطلب اهتماماً فورياً'}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px'
      }}>
        <button
          onClick={shareOnTwitter}
          style={{
            padding: '15px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(45deg, #1da1f2, #0d8bd9)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🐦 مشاركة على تويتر
        </button>

        <button
          style={{
            padding: '15px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(45deg, #2ed573, #1dd1a1)',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          🛡️ تأمين الأصل (${insurancePrice})
        </button>
      </div>

      <div style={{
        marginTop: '20px',
        padding: '15px',
        background: 'rgba(0, 255, 255, 0.1)',
        borderRadius: '10px',
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.8)',
        border: '1px solid rgba(0, 255, 255, 0.3)'
      }}>
        <p style={{ margin: 0 }}>
          <strong>💡 نصيحة:</strong> شارك نتائج الفحص على تويتر لكسب نقاط إضافية! 
          كل 3 إعجابات أو إعادة تغريد = نقطة واحدة، وكل تعليق = نقطة واحدة.
        </p>
      </div>
    </div>
  );
}