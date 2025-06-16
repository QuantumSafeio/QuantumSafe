import React, { useState, useEffect } from 'react';
import { supabase, getUserPoints, updateUserPoints, saveScanResult } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { scanAsset } from '../services/scanner';
import ScanResult from './ScanResult';

export default function Dashboard() {
  const { user } = useAuth();
  const [assetType, setAssetType] = useState('contract');
  const [assetInput, setAssetInput] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [points, setPoints] = useState(0);
  const [refCopied, setRefCopied] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  // تحميل نقاط المستخدم وتاريخ الفحص
  useEffect(() => {
    if (user?.id) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    try {
      // تحميل النقاط
      const userPoints = await getUserPoints(user.id);
      setPoints(userPoints);

      // تحميل تاريخ الفحص
      const { data: scans } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      setScanHistory(scans || []);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  // فحص الأصول
  const handleScan = async () => {
    if (points < 10) {
      alert('ليس لديك نقاط كافية للفحص! تحتاج إلى 10 نقاط على الأقل.');
      return;
    }

    if (!assetInput.trim()) {
      alert('يرجى إدخال عنوان الأصل أو البيانات.');
      return;
    }

    setLoading(true);
    
    try {
      // تنفيذ الفحص
      const result = await scanAsset(assetType, assetInput);
      setScanResult(result);

      // حفظ نتيجة الفحص
      await saveScanResult(user.id, result);

      // خصم النقاط
      const newPoints = points - 10;
      await updateUserPoints(user.id, newPoints);
      setPoints(newPoints);

      // تحديث تاريخ الفحص
      loadUserData();
    } catch (error) {
      console.error('Error during scan:', error);
      alert('حدث خطأ أثناء الفحص. يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  // نسخ رابط الإحالة
  const handleCopyReferral = () => {
    const referralLink = `${window.location.origin}/login?ref=${user.id}`;
    navigator.clipboard.writeText(referralLink);
    setRefCopied(true);
    setTimeout(() => setRefCopied(false), 2000);
  };

  // تسجيل الخروج
  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const getReferralLink = () => {
    return `${window.location.origin}/login?ref=${user.id}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 50%, #16213e 100%)',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* الهيدر */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '15px',
          backdropFilter: 'blur(10px)'
        }}>
          <div>
            <h1 style={{
              fontSize: '2rem',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              🛡️ QuantumSafe
            </h1>
            <p style={{ margin: '5px 0 0 0', opacity: 0.8 }}>
              مرحباً، {user?.email}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              padding: '10px 20px',
              borderRadius: '25px',
              fontWeight: 'bold'
            }}>
              💎 {points} نقطة
            </div>
            <button
              onClick={handleSignOut}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 0, 0, 0.2)',
                border: '1px solid rgba(255, 0, 0, 0.5)',
                borderRadius: '10px',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              تسجيل خروج
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
          {/* قسم الفحص الرئيسي */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            padding: '30px',
            backdropFilter: 'blur(10px)'
          }}>
            <h2 style={{ marginBottom: '25px', color: '#00f5ff' }}>
              🔍 فحص الأصول الرقمية
            </h2>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                نوع الأصل:
              </label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px'
                }}
              >
                <option value="contract">عقد ذكي (Smart Contract)</option>
                <option value="wallet">محفظة (Wallet)</option>
                <option value="nft">رمز غير قابل للاستبدال (NFT)</option>
                <option value="memecoin">عملة ميم (Memecoin)</option>
                <option value="app">تطبيق لامركزي (DApp)</option>
              </select>
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                عنوان الأصل أو البيانات:
              </label>
              <input
                type="text"
                placeholder="أدخل عنوان الأصل أو البيانات المراد فحصها"
                value={assetInput}
                onChange={(e) => setAssetInput(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '16px'
                }}
              />
            </div>

            <button
              onClick={handleScan}
              disabled={loading || points < 10}
              style={{
                width: '100%',
                padding: '15px',
                borderRadius: '15px',
                border: 'none',
                background: loading || points < 10 
                  ? 'rgba(128, 128, 128, 0.5)' 
                  : 'linear-gradient(45deg, #00f5ff, #ff00ff)',
                color: 'white',
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: loading || points < 10 ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {loading ? '🔄 جاري الفحص...' : '🚀 ابدأ الفحص (10 نقاط)'}
            </button>

            {/* نتيجة الفحص */}
            {scanResult && (
              <ScanResult 
                result={scanResult} 
                assetType={assetType} 
                user={user} 
              />
            )}
          </div>

          {/* الشريط الجانبي */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* رابط الإحالة */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#ff00ff' }}>
                🎁 رابط الإحالة
              </h3>
              <input
                type="text"
                value={getReferralLink()}
                readOnly
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  fontSize: '12px',
                  marginBottom: '10px'
                }}
              />
              <button
                onClick={handleCopyReferral}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: refCopied ? 'rgba(0, 255, 0, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                {refCopied ? '✅ تم النسخ!' : '📋 نسخ الرابط'}
              </button>
            </div>

            {/* إحصائيات سريعة */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '15px',
              padding: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              <h3 style={{ marginBottom: '15px', color: '#00f5ff' }}>
                📊 الإحصائيات
              </h3>
              <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                <p>🔍 عدد الفحوصات: {scanHistory.length}</p>
                <p>💎 النقاط المتاحة: {points}</p>
                <p>🎯 المستوى: {points > 100 ? 'متقدم' : points > 50 ? 'متوسط' : 'مبتدئ'}</p>
              </div>
            </div>

            {/* تاريخ الفحص */}
            {scanHistory.length > 0 && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                padding: '20px',
                backdropFilter: 'blur(10px)'
              }}>
                <h3 style={{ marginBottom: '15px', color: '#ff00ff' }}>
                  📝 آخر الفحوصات
                </h3>
                <div style={{ fontSize: '12px' }}>
                  {scanHistory.slice(0, 3).map((scan, index) => (
                    <div key={index} style={{
                      padding: '8px',
                      marginBottom: '8px',
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ fontWeight: 'bold' }}>
                        {scan.asset_type} - {scan.quantum_risk}
                      </div>
                      <div style={{ opacity: 0.7 }}>
                        {new Date(scan.created_at).toLocaleDateString('ar')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* معلومات إضافية */}
        <div style={{
          marginTop: '30px',
          padding: '20px',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '15px',
          fontSize: '14px',
          lineHeight: '1.6'
        }}>
          <h3 style={{ color: '#00f5ff', marginBottom: '15px' }}>
            💡 كيفية كسب النقاط
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
            <div>• كل 3 إعجابات أو إعادة تغريد = نقطة واحدة</div>
            <div>• كل تعليق على تغريدتك = نقطة واحدة</div>
            <div>• دعوة الأصدقاء = 10 نقاط لكل صديق</div>
            <div>• التسجيل الجديد = 50 نقطة مجانية</div>
          </div>
        </div>
      </div>
    </div>
  );
}