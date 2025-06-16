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
    
    if (error) throw error
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
      .upsert({ user_id: userId, points })
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