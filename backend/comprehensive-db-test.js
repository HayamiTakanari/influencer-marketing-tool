const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function comprehensiveDbTest() {
  console.log('🔍 包括的データベーステスト開始\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = {
    passed: [],
    failed: [],
    warnings: []
  };

  try {
    // 1. 接続テスト
    console.log('【1】基本接続テスト');
    try {
      await prisma.$connect();
      console.log('✅ データベース接続成功\n');
      results.passed.push('データベース接続');
    } catch (error) {
      console.error('❌ データベース接続失敗:', error.message);
      results.failed.push('データベース接続');
      throw error;
    }

    // 2. 全テーブル存在確認
    console.log('【2】全テーブル存在確認');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const expectedTables = [
      'User', 'Client', 'Influencer', 'Project', 'Application',
      'SocialAccount', 'Portfolio', 'Message', 'Transaction', 'Notification',
      'Team', 'TeamMember', 'Review',
      'Achievement', 'ServicePricing', 'BulkInquiry', 'InquiryResponse',
      'ProjectSchedule', 'Milestone',
      'SecurityLog', 'SecurityStats', 'SecurityRule', 'IPBlacklist'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingTables = expectedTables.filter(t => !existingTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log(`✅ 全テーブル存在 (${tables.length}個)`);
      results.passed.push('全テーブル存在確認');
    } else {
      console.log(`⚠️  不足テーブル: ${missingTables.join(', ')}`);
      results.warnings.push(`不足テーブル: ${missingTables.join(', ')}`);
    }
    console.log('');

    // 3. User テーブル CRUD テスト
    console.log('【3】User テーブル CRUD テスト');
    try {
      // Create
      const testUser = await prisma.user.create({
        data: {
          email: `test_${Date.now()}@example.com`,
          password: 'hashed_password_test',
          role: 'CLIENT',
        }
      });
      console.log('  ✅ CREATE: ユーザー作成成功');

      // Read
      const readUser = await prisma.user.findUnique({
        where: { id: testUser.id }
      });
      if (readUser) {
        console.log('  ✅ READ: ユーザー取得成功');
      }

      // Update
      const updatedUser = await prisma.user.update({
        where: { id: testUser.id },
        data: { role: 'INFLUENCER' }
      });
      if (updatedUser.role === 'INFLUENCER') {
        console.log('  ✅ UPDATE: ユーザー更新成功');
      }

      // Delete
      await prisma.user.delete({
        where: { id: testUser.id }
      });
      console.log('  ✅ DELETE: ユーザー削除成功');
      
      results.passed.push('User CRUD操作');
      console.log('');
    } catch (error) {
      console.error('  ❌ User CRUD失敗:', error.message);
      results.failed.push('User CRUD操作');
    }

    // 4. リレーションシップテスト
    console.log('【4】リレーションシップテスト');
    try {
      const testUser2 = await prisma.user.create({
        data: {
          email: `relation_test_${Date.now()}@example.com`,
          password: 'hashed_password',
          role: 'CLIENT',
        }
      });

      const testClient = await prisma.client.create({
        data: {
          userId: testUser2.id,
          companyName: 'テスト株式会社',
          contactName: 'テスト太郎',
          contactPhone: '090-1234-5678',
        }
      });
      console.log('  ✅ User -> Client リレーション成功');

      // リレーションを含む取得
      const userWithClient = await prisma.user.findUnique({
        where: { id: testUser2.id },
        include: { client: true }
      });

      if (userWithClient?.client?.companyName === 'テスト株式会社') {
        console.log('  ✅ Include クエリ成功');
      }

      // クリーンアップ
      await prisma.client.delete({ where: { id: testClient.id } });
      await prisma.user.delete({ where: { id: testUser2.id } });

      results.passed.push('リレーションシップ');
      console.log('');
    } catch (error) {
      console.error('  ❌ リレーションシップテスト失敗:', error.message);
      results.failed.push('リレーションシップ');
    }

    // 5. Enum型テスト
    console.log('【5】Enum型テスト');
    try {
      const enumTest = await prisma.user.create({
        data: {
          email: `enum_test_${Date.now()}@example.com`,
          password: 'test',
          role: 'INFLUENCER', // UserRole enum
        }
      });

      if (enumTest.role === 'INFLUENCER') {
        console.log('  ✅ UserRole Enum 正常');
      }

      await prisma.user.delete({ where: { id: enumTest.id } });
      results.passed.push('Enum型');
      console.log('');
    } catch (error) {
      console.error('  ❌ Enum型テスト失敗:', error.message);
      results.failed.push('Enum型');
    }

    // 6. トランザクションテスト
    console.log('【6】トランザクションテスト');
    try {
      await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: `transaction_test_${Date.now()}@example.com`,
            password: 'test',
            role: 'CLIENT',
          }
        });

        const client = await tx.client.create({
          data: {
            userId: user.id,
            companyName: 'トランザクションテスト',
            contactName: 'テスト',
            contactPhone: '090-0000-0000',
          }
        });

        // ロールバックテスト用にクリーンアップ
        await tx.client.delete({ where: { id: client.id } });
        await tx.user.delete({ where: { id: user.id } });
      });

      console.log('  ✅ トランザクション成功');
      results.passed.push('トランザクション');
      console.log('');
    } catch (error) {
      console.error('  ❌ トランザクション失敗:', error.message);
      results.failed.push('トランザクション');
    }

    // 7. 複雑なクエリテスト
    console.log('【7】複雑なクエリテスト');
    try {
      // WHERE条件付きクエリ
      const users = await prisma.user.findMany({
        where: {
          role: 'CLIENT',
          createdAt: {
            gte: new Date('2020-01-01')
          }
        },
        take: 5
      });
      console.log(`  ✅ WHERE条件付きクエリ成功 (${users.length}件取得)`);

      // 集計クエリ
      const userCount = await prisma.user.count();
      console.log(`  ✅ COUNT集計成功 (${userCount}件)`);

      results.passed.push('複雑なクエリ');
      console.log('');
    } catch (error) {
      console.error('  ❌ 複雑なクエリ失敗:', error.message);
      results.failed.push('複雑なクエリ');
    }

    // 8. JSON型テスト (Achievement.metrics)
    console.log('【8】JSON型フィールドテスト');
    try {
      const testUser3 = await prisma.user.create({
        data: {
          email: `json_test_${Date.now()}@example.com`,
          password: 'test',
          role: 'INFLUENCER',
        }
      });

      const testInfluencer = await prisma.influencer.create({
        data: {
          userId: testUser3.id,
          displayName: 'JSONテスト',
          categories: ['ファッション'],
          isRegistered: true,
        }
      });

      const achievement = await prisma.achievement.create({
        data: {
          influencerId: testInfluencer.id,
          projectName: 'テストプロジェクト',
          brandName: 'テストブランド',
          purpose: 'SALES',
          platform: 'INSTAGRAM',
          description: 'JSON型テスト',
          metrics: {
            impressions: 10000,
            clicks: 500,
            conversions: 50
          }
        }
      });

      if (achievement.metrics && achievement.metrics.impressions === 10000) {
        console.log('  ✅ JSON型フィールド成功');
        results.passed.push('JSON型フィールド');
      }

      // クリーンアップ
      await prisma.achievement.delete({ where: { id: achievement.id } });
      await prisma.influencer.delete({ where: { id: testInfluencer.id } });
      await prisma.user.delete({ where: { id: testUser3.id } });
      console.log('');
    } catch (error) {
      console.error('  ❌ JSON型テスト失敗:', error.message);
      results.failed.push('JSON型フィールド');
    }

    // 9. 配列型テスト (Influencer.categories)
    console.log('【9】配列型フィールドテスト');
    try {
      const testUser4 = await prisma.user.create({
        data: {
          email: `array_test_${Date.now()}@example.com`,
          password: 'test',
          role: 'INFLUENCER',
        }
      });

      const influencer = await prisma.influencer.create({
        data: {
          userId: testUser4.id,
          displayName: '配列テスト',
          categories: ['ファッション', '美容', 'ライフスタイル'],
          isRegistered: true,
        }
      });

      if (influencer.categories.length === 3 && influencer.categories.includes('美容')) {
        console.log('  ✅ 配列型フィールド成功');
        results.passed.push('配列型フィールド');
      }

      await prisma.influencer.delete({ where: { id: influencer.id } });
      await prisma.user.delete({ where: { id: testUser4.id } });
      console.log('');
    } catch (error) {
      console.error('  ❌ 配列型テスト失敗:', error.message);
      results.failed.push('配列型フィールド');
    }

    // 10. インデックス・パフォーマンステスト
    console.log('【10】パフォーマンステスト');
    try {
      const startTime = Date.now();
      await prisma.user.findMany({
        where: { role: 'CLIENT' },
        take: 100
      });
      const queryTime = Date.now() - startTime;

      if (queryTime < 1000) {
        console.log(`  ✅ クエリ実行時間: ${queryTime}ms (良好)`);
        results.passed.push('パフォーマンス');
      } else {
        console.log(`  ⚠️  クエリ実行時間: ${queryTime}ms (要最適化)`);
        results.warnings.push('クエリ実行時間が遅い');
      }
      console.log('');
    } catch (error) {
      console.error('  ❌ パフォーマンステスト失敗:', error.message);
      results.failed.push('パフォーマンス');
    }

    // 最終結果
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 テスト結果サマリー\n');
    
    console.log(`✅ 成功: ${results.passed.length}個`);
    results.passed.forEach(test => console.log(`   - ${test}`));
    console.log('');

    if (results.warnings.length > 0) {
      console.log(`⚠️  警告: ${results.warnings.length}個`);
      results.warnings.forEach(warning => console.log(`   - ${warning}`));
      console.log('');
    }

    if (results.failed.length > 0) {
      console.log(`❌ 失敗: ${results.failed.length}個`);
      results.failed.forEach(test => console.log(`   - ${test}`));
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (results.failed.length === 0) {
      console.log('🎉 すべてのテストに成功しました！');
      console.log('データベースは正常に動作しています。\n');
    } else {
      console.log('⚠️  一部のテストに失敗しました。');
      console.log('詳細を確認して修正してください。\n');
      process.exit(1);
    }

  } catch (error) {
    console.error('\n❌ 致命的なエラーが発生しました:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 実行
comprehensiveDbTest()
  .catch(error => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
