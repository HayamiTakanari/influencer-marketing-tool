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
          setData(influencer)
        }

        setLoading(false)

        // リアルタイムリスナーを設定
        subscription = supabase
          .from('influencer')
          .on('*', (payload) => {
            if (payload.new.id === influencerId) {
              setData(payload.new)
            }
          })
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
