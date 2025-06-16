import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database operations
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
        points,
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
        scanned_at: scanData.scannedAt
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
    const { data, error } = await supabase
      .from('referrals')
      .insert({
        new_user_id: newUserId,
        referrer_id: referrerId,
        created_at: new Date().toISOString()
      })
      .select()
    
    if (error) throw error
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
    return {
      totalReferrals: data?.length || 0,
      totalPointsEarned: (data?.length || 0) * 10
    }
  } catch (error) {
    console.error('Error fetching referral stats:', error)
    return { totalReferrals: 0, totalPointsEarned: 0 }
  }
}