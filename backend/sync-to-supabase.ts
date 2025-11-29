import { PrismaClient } from '@prisma/client'

// ローカルデータベース用のPrismaクライアント
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/influencer_marketing'
    }
  }
})

// Supabase用のPrismaクライアント
const supabasePrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.SUPABASE_DATABASE_URL || 'postgresql://postgres.ekqvrfjpumnuuwctluum:[YOUR_DB_PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres'
    }
  }
})

async function syncData() {
  try {
    console.log('🔄 Syncing data from local database to Supabase...')

    // ユーザーデータをコピー
    console.log('📋 Syncing users...')
    const users = await localPrisma.user.findMany()
    for (const user of users) {
      await supabasePrisma.user.upsert({
        where: { id: user.id },
        update: user,
        create: user
      })
    }
    console.log(`✅ ${users.length} users synced`)

    // インフルエンサーデータをコピー
    console.log('👥 Syncing influencers...')
    const influencers = await localPrisma.influencer.findMany()
    for (const influencer of influencers) {
      await supabasePrisma.influencer.upsert({
        where: { id: influencer.id },
        update: influencer,
        create: influencer
      })
    }
    console.log(`✅ ${influencers.length} influencers synced`)

    // ソーシャルアカウントデータをコピー
    console.log('📱 Syncing social accounts...')
    const socialAccounts = await localPrisma.socialAccount.findMany()
    for (const account of socialAccounts) {
      await supabasePrisma.socialAccount.upsert({
        where: { id: account.id },
        update: account,
        create: account
      })
    }
    console.log(`✅ ${socialAccounts.length} social accounts synced`)

    // ポートフォリオデータをコピー
    console.log('🖼️ Syncing portfolios...')
    const portfolios = await localPrisma.portfolio.findMany()
    for (const portfolio of portfolios) {
      await supabasePrisma.portfolio.upsert({
        where: { id: portfolio.id },
        update: portfolio,
        create: portfolio
      })
    }
    console.log(`✅ ${portfolios.length} portfolios synced`)

    // プロジェクトデータをコピー
    console.log('📊 Syncing projects...')
    const projects = await localPrisma.project.findMany()
    for (const project of projects) {
      await supabasePrisma.project.upsert({
        where: { id: project.id },
        update: project,
        create: project
      })
    }
    console.log(`✅ ${projects.length} projects synced`)

    // クライアントデータをコピー
    console.log('🏢 Syncing clients...')
    const clients = await localPrisma.client.findMany()
    for (const client of clients) {
      await supabasePrisma.client.upsert({
        where: { id: client.id },
        update: client,
        create: client
      })
    }
    console.log(`✅ ${clients.length} clients synced`)

    // 実績データをコピー
    console.log('🏆 Syncing achievements...')
    const achievements = await localPrisma.achievement.findMany()
    for (const achievement of achievements) {
      await supabasePrisma.achievement.upsert({
        where: { id: achievement.id },
        update: achievement,
        create: achievement
      })
    }
    console.log(`✅ ${achievements.length} achievements synced`)

    console.log('✨ All data synced successfully!')
    console.log('🎉 Supabase database is now up to date with local data')
  } catch (error) {
    console.error('❌ Error syncing data:', error)
    process.exit(1)
  } finally {
    await localPrisma.$disconnect()
    await supabasePrisma.$disconnect()
  }
}

syncData()
