import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function Login() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [wallet, setWallet] = useState(null);
  const [walletError, setWalletError] = useState('');
  const [referral, setReferral] = useState(null);

  // التحقق من رمز الإحالة في الرابط
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      localStorage.setItem('referral', ref);
      setReferral(ref);
    }
  }, []);

  // إعادة توجيه إذا كان المستخدم مسجل دخول
  if (user) {
    return <Navigate to="/" />;
  }

  // تسجيل الدخول بالإيميل
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = isSignUp
        ? await supabase.auth.signUp({ email, password })
        : await supabase.auth.signInWithPassword({ email, password });

      if (error) throw error;

      if (isSignUp && data.user) {
        // إضافة نقاط ابتدائية للمستخدم الجديد
        await supabase
          .from('user_points')
          .insert({ user_id: data.user.id, points: 50 });

        // معالجة الإحالة إذا وجدت
        const referralCode = localStorage.getItem('referral');
        if (referralCode) {
          await supabase
            .from('referrals')
            .insert({
              new_user_id: data.user.id,
              referrer_id: referralCode
            });
          localStorage.removeItem('referral');
        }
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // ربط محفظة Web3
  const handleWeb3Login = async () => {
    setWalletError('');
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setWallet(accounts[0]);
        
        // يمكن ربط المحفظة بالمستخدم هنا
        alert(`تم ربط المحفظة: ${accounts[0]}`);
      } catch (err) {
        setWalletError('فشل في الاتصال بمحفظة MetaMask.');
      }
    } else {
      setWalletError('يرجى تثبيت MetaMask أولاً.');
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '40px',
        maxWidth: '400px',
        width: '100%',
        border: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <h1 style={{
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '2.5rem',
          background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold'
        }}>
          🛡️ QuantumSafe
        </h1>

        <form onSubmit={handleEmailAuth} style={{ marginBottom: '20px' }}>
          <input
            type="email"
            placeholder="البريد الإلكتروني"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '15px',
              border: 'none',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '16px'
            }}
          />
          <input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: '20px',
              border: 'none',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '16px'
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              border: 'none',
              borderRadius: '10px',
              background: 'linear-gradient(45deg, #00f5ff, #ff00ff)',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              marginBottom: '10px'
            }}
          >
            {loading ? 'جاري التحميل...' : (isSignUp ? 'إنشاء حساب' : 'تسجيل الدخول')}
          </button>
        </form>

        <button
          onClick={() => setIsSignUp(!isSignUp)}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '10px',
            background: 'transparent',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          {isSignUp ? 'لديك حساب؟ سجل دخول' : 'ليس لديك حساب؟ أنشئ حساب'}
        </button>

        <div style={{ textAlign: 'center', margin: '20px 0', color: 'rgba(255, 255, 255, 0.7)' }}>
          أو
        </div>

        <button
          onClick={handleWeb3Login}
          style={{
            width: '100%',
            padding: '12px',
            border: 'none',
            borderRadius: '10px',
            background: '#f6851b',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          🦊 ربط محفظة MetaMask
        </button>

        {wallet && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px',
            background: 'rgba(0, 255, 0, 0.2)',
            borderRadius: '10px',
            fontSize: '14px'
          }}>
            ✅ تم ربط المحفظة: <br />
            <code style={{ fontSize: '12px' }}>{wallet}</code>
          </div>
        )}

        {walletError && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px',
            background: 'rgba(255, 0, 0, 0.2)',
            borderRadius: '10px',
            color: '#ff6b6b',
            fontSize: '14px'
          }}>
            {walletError}
          </div>
        )}

        {referral && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px',
            background: 'rgba(0, 255, 255, 0.2)',
            borderRadius: '10px',
            fontSize: '14px'
          }}>
            🎁 رمز الإحالة: <strong>{referral}</strong>
          </div>
        )}
      </div>

      <div style={{
        marginTop: '30px',
        textAlign: 'center',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        maxWidth: '500px'
      }}>
        <p>
          <strong>🔐 كيف يعمل تسجيل الدخول في QuantumSafe؟</strong><br />
          • سجل دخول بالإيميل للوصول إلى لوحة التحكم وفحص الأصول<br />
          • أو اربط محفظة Web3 للوصول المباشر<br />
          • احصل على 50 نقطة مجانية عند التسجيل!
        </p>
      </div>
    </div>
  );
}