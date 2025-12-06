import { supabase } from '@/lib/supabase'

/**
 * Supabaseサービス - データベース操作の統一インターフェース
 */

export interface InfluencerProfile {
  id: string
  displayName: string
  bio: string
  categories: string[]
  prefecture: string
  city: string
  priceMin: number
  priceMax: number
  gender: string
  birthDate: string
  createdAt?: string
  updatedAt?: string
}

export interface SocialAccount {
  id: string
  influencerId: string
  platform: string
  username: string
  profileUrl: string
  followerCount: number
  engagementRate: number
  isVerified: boolean
  createdAt?: string
}

export interface PortfolioItem {
  id: string
  influencerId: string
  title: string
  description: string
  imageUrl: string
  link: string
  platform: string
  createdAt?: string
}

export interface InfluencerWithRelations extends InfluencerProfile {
  user?: {
    id: string
    email: string
  }
  socialAccounts: SocialAccount[]
  portfolio: PortfolioItem[]
}

/**
 * インフルエンサーを ID で取得
 */
export const fetchInfluencerById = async (
  id: string
): Promise<InfluencerWithRelations | null> => {
  try {
    const { data, error } = await supabase
      .from('influencer')
      .select(
        `
        id,
        displayName,
        bio,
        categories,
        prefecture,
        city,
        priceMin,
        priceMax,
        gender,
        birthDate,
        createdAt,
        updatedAt,
        user:user_id(id, email),
        socialAccounts:socialAccount(id, influencerId, platform, username, profileUrl, followerCount, engagementRate, isVerified, createdAt),
        portfolio(id, influencerId, title, description, imageUrl, link, platform, createdAt)
      `
      )
      .eq('id', id)
      .single()

    if (error) {
      console.error('Supabase fetch error:', error)
      return null
    }

    if (data) {
      if (data.user && Array.isArray(data.user)) {
        (data as any).user = data.user[0] || undefined
      }
    }
    
    return data as unknown as InfluencerWithRelations
  } catch (err) {
    console.error('Error fetching influencer:', err)
    return null
  }
}

/**
 * すべてのインフルエンサーを取得
 */
export const fetchAllInfluencers = async (): Promise<
  InfluencerWithRelations[]
> => {
  try {
    const { data, error } = await supabase
      .from('influencer')
      .select(
        `
        id,
        displayName,
        bio,
        categories,
        prefecture,
        city,
        priceMin,
        priceMax,
        gender,
        birthDate,
        createdAt,
        updatedAt,
        user:user_id(id, email),
        socialAccounts:socialAccount(id, influencerId, platform, username, profileUrl, followerCount, engagementRate, isVerified),
        portfolio(id, influencerId, title, description, imageUrl, link, platform)
      `
      )
      .order('displayName', { ascending: true })

    if (error) {
      console.error('Supabase fetch error:', error)
      return []
    }

    const transformed = (data || []).map(item => ({
      ...item,
      user: Array.isArray((item as any).user) ? (item as any).user[0] : (item as any).user
    }))
    
    return transformed as unknown as InfluencerWithRelations[]
  } catch (err) {
    console.error('Error fetching influencers:', err)
    return []
  }
}

/**
 * インフルエンサーを検索（カテゴリまたは場所）
 */
export const searchInfluencers = async (
  query: string
): Promise<InfluencerWithRelations[]> => {
  try {
    const { data, error } = await supabase
      .from('influencer')
      .select(
        `
        id,
        displayName,
        bio,
        categories,
        prefecture,
        city,
        priceMin,
        priceMax,
        gender,
        birthDate,
        createdAt,
        updatedAt,
        user:user_id(id, email),
        socialAccounts:socialAccount(id, influencerId, platform, username, profileUrl, followerCount, engagementRate, isVerified),
        portfolio(id, influencerId, title, description, imageUrl, link, platform)
      `
      )
      .or(
        `displayName.ilike.%${query}%,bio.ilike.%${query}%,categories.cs.{${query}}`
      )

    if (error) {
      console.error('Supabase search error:', error)
      return []
    }

    const transformed = (data || []).map(item => ({
      ...item,
      user: Array.isArray((item as any).user) ? (item as any).user[0] : (item as any).user
    }))
    
    return transformed as unknown as InfluencerWithRelations[]
  } catch (err) {
    console.error('Error searching influencers:', err)
    return []
  }
}

/**
 * Realtimeサブスクリプション設定 - インフルエンサーの変更を監視
 */
export const subscribeToInfluencerChanges = (
  influencerId: string,
  onChangeCallback: (data: InfluencerWithRelations) => void
) => {
  const subscription = supabase
    .channel(`influencer:${influencerId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'influencer', filter: `id=eq.${influencerId}` },
      async (payload) => {
        // 完全なデータを再度取得
        const updated = await fetchInfluencerById(influencerId)
        if (updated) {
          onChangeCallback(updated)
        }
      }
    )
    .subscribe()

  return () => {
    subscription?.unsubscribe()
  }
}

/**
 * Realtimeサブスクリプション設定 - ソーシャルアカウントの変更を監視
 */
export const subscribeToSocialAccountChanges = (
  influencerId: string,
  onChangeCallback: (accounts: SocialAccount[]) => void
) => {
  const subscription = supabase
    .channel(`socialAccount:${influencerId}`)
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'socialAccount', filter: `influencerId=eq.${influencerId}` },
      async (payload) => {
        const { data, error } = await supabase
          .from('socialAccount')
          .select('*')
          .eq('influencerId', influencerId)

        if (!error && data) {
          onChangeCallback(data as SocialAccount[])
        }
      }
    )
    .subscribe()

  return () => {
    subscription?.unsubscribe()
  }
}

/**
 * ソーシャルアカウントを取得
 */
export const fetchSocialAccounts = async (
  influencerId: string
): Promise<SocialAccount[]> => {
  try {
    const { data, error } = await supabase
      .from('socialAccount')
      .select('*')
      .eq('influencerId', influencerId)
      .order('platform', { ascending: true })

    if (error) {
      console.error('Supabase fetch error:', error)
      return []
    }

    return (data || []) as SocialAccount[]
  } catch (err) {
    console.error('Error fetching social accounts:', err)
    return []
  }
}

/**
 * ポートフォリオを取得
 */
export const fetchPortfolio = async (
  influencerId: string
): Promise<PortfolioItem[]> => {
  try {
    const { data, error } = await supabase
      .from('portfolio')
      .select('*')
      .eq('influencerId', influencerId)
      .order('createdAt', { ascending: false })

    if (error) {
      console.error('Supabase fetch error:', error)
      return []
    }

    return (data || []) as PortfolioItem[]
  } catch (err) {
    console.error('Error fetching portfolio:', err)
    return []
  }
}
