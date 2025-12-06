import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export interface InfluencerData {
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
  user: {
    id: string
    email: string
  }
  socialAccounts: Array<{
    id: string
    platform: string
    username: string
    profileUrl: string
    followerCount: number
    engagementRate: number
    isVerified: boolean
  }>
  portfolio: Array<{
    id: string
    title: string
    description: string
    imageUrl: string
    link: string
    platform: string
  }>
}

export const useInfluencerRealtime = (influencerId: string) => {
  const [data, setData] = useState<InfluencerData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let subscription: any

    const fetchAndSubscribe = async () => {
      try {
        // 初期データを取得
        const { data: influencer, error: fetchError } = await supabase
          .from('influencer')
          .select(`
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
            user:user_id(id, email),
            socialAccounts:socialAccount(id, platform, username, profileUrl, followerCount, engagementRate, isVerified),
            portfolio(id, title, description, imageUrl, link, platform)
          `)
          .eq('id', influencerId)
          .single()

        if (fetchError) {
          throw fetchError
        }

        if (influencer) {
          // Transform user array to object if needed
          const transformedInfluencer = {
            ...influencer,
            user: Array.isArray(influencer.user) && influencer.user.length > 0
              ? influencer.user[0]
              : influencer.user
          }
          setData(transformedInfluencer as InfluencerData)
        }

        setLoading(false)

        // リアルタイムリスナーを設定（新しい API）
        subscription = supabase
          .channel(`influencer-${influencerId}`)
          .on('postgres_changes',
            { event: '*', schema: 'public', table: 'influencer', filter: `id=eq.${influencerId}` },
            (payload: any) => {
              if (payload.new) {
                const newData = payload.new as any;
                const transformedData = {
                  ...newData,
                  user: Array.isArray(newData?.user) && newData?.user.length > 0
                    ? newData.user[0]
                    : newData?.user
                }
                setData(transformedData as InfluencerData)
              }
            }
          )
          .subscribe()
      } catch (err) {
        console.error('Error fetching influencer:', err)
        setError(err instanceof Error ? err : new Error('Unknown error'))
        setLoading(false)
      }
    }

    fetchAndSubscribe()

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [influencerId])

  return { data, loading, error }
}
