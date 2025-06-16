import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Enhanced database operations with better error handling and caching
export async function getUserPoints(userId) {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .select('points')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data?.points || 0
  } catch (error) {
    console.error('Error fetching user points:', error)
    return 0
  }
}

export async function updateUserPoints(userId, points) {
  try {
    const { data, error } = await supabase
      .from('user_points')
      .upsert({ 
        user_id: userId, 
        points: Math.round(points * 10) / 10, // Round to 1 decimal place
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user points:', error)
    return null
  }
}

export async function addPointsToUser(userId, pointsToAdd, source = 'general') {
  try {
    // Get current points
    const currentPoints = await getUserPoints(userId);
    const newPoints = currentPoints + pointsToAdd;
    
    // Update points
    const result = await updateUserPoints(userId, newPoints);
    
    // Log the points transaction
    await supabase
      .from('points_transactions')
      .insert({
        user_id: userId,
        points_change: pointsToAdd,
        source: source,
        created_at: new Date().toISOString()
      });
    
    return result;
  } catch (error) {
    console.error('Error adding points to user:', error);
    return null;
  }
}

export async function saveScanResult(userId, scanData) {
  try {
    const { data, error } = await supabase
      .from('scan_results')
      .insert({
        user_id: userId,
        asset_type: scanData.type,
        asset_address: scanData.asset,
        quantum_risk: scanData.quantumRisk,
        vulnerabilities: scanData.details,
        scanned_at: scanData.scannedAt,
        confidence: scanData.confidence || 85
      })
      .select()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error saving scan result:', error)
    return null
  }
}

export async function saveReferral(newUserId, referrerId) {
  try {
    // Check if referral already exists
    const { data: existingReferral } = await supabase
      .from('referrals')
      .select('id')
      .eq('new_user_id', newUserId)
      .single();
    
    if (existingReferral) {
      return existingReferral; // Referral already exists
    }
    
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        new_user_id: newUserId,
        referrer_id: referrerId,
        points_awarded: 10,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    
    // Award 7% of referral points to referrer (0.7 points from 10 point referral)
    const referralBonus = Math.round(10 * 0.07 * 10) / 10; // 0.7 points
    await addPointsToUser(referrerId, referralBonus, 'referral_bonus');
    
    return data
  } catch (error) {
    console.error('Error saving referral:', error)
    return null
  }
}

export async function getUserProfile(userId) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

export async function updateUserProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}

export async function getScanHistory(userId, limit = 10) {
  try {
    const { data, error } = await supabase
      .from('scan_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching scan history:', error)
    return []
  }
}

export async function getReferralStats(userId) {
  try {
    const { data, error } = await supabase
      .from('referrals')
      .select('*')
      .eq('referrer_id', userId)
    
    if (error) throw error
    
    const totalReferrals = data?.length || 0;
    const totalPointsEarned = totalReferrals * 0.7; // 7% of 10 points per referral
    
    return {
      totalReferrals,
      totalPointsEarned: Math.round(totalPointsEarned * 10) / 10
    }
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return { totalReferrals: 0, totalPointsEarned: 0 }
  }
}

export async function getPointsTransactions(userId, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('points_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching points transactions:', error)
    return []
  }
}

export async function getUserStats(userId) {
  try {
    const [points, profile, scanHistory, referralStats] = await Promise.all([
      getUserPoints(userId),
      getUserProfile(userId),
      getScanHistory(userId, 5),
      getReferralStats(userId)
    ]);
    
    return {
      points,
      profile,
      totalScans: scanHistory.length,
      recentScans: scanHistory,
      referrals: referralStats
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    return {
      points: 0,
      profile: null,
      totalScans: 0,
      recentScans: [],
      referrals: { totalReferrals: 0, totalPointsEarned: 0 }
    };
  }
}