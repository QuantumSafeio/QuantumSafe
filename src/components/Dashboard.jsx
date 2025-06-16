import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

export default function Dashboard() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [userPoints, setUserPoints] = useState(0);
  const [scanResults, setScanResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setUserProfile(profile);

      // Fetch user points
      const { data: points } = await supabase
        .from('user_points')
        .select('points')
        .eq('user_id', user.id)
        .single();
      
      setUserPoints(points?.points || 0);

      // Fetch recent scan results
      const { data: scans } = await supabase
        .from('scan_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      setScanResults(scans || []);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.email}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Points Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Points</h3>
            <p className="text-3xl font-bold text-blue-600">{userPoints}</p>
          </div>

          {/* Total Scans Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Scans</h3>
            <p className="text-3xl font-bold text-green-600">{userProfile?.total_scans || 0}</p>
          </div>

          {/* Wallet Address Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Wallet Address</h3>
            <p className="text-sm text-gray-600 truncate">
              {userProfile?.wallet_address || 'Not connected'}
            </p>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Scans</h3>
          </div>
          <div className="p-6">
            {scanResults.length > 0 ? (
              <div className="space-y-4">
                {scanResults.map((scan) => (
                  <div key={scan.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{scan.asset_type}</p>
                        <p className="text-sm text-gray-600 truncate">{scan.asset_address}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(scan.scanned_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        scan.quantum_risk === 'high' ? 'bg-red-100 text-red-800' :
                        scan.quantum_risk === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {scan.quantum_risk} risk
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No scans yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}