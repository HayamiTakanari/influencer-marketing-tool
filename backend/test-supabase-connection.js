const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

async function testSupabaseConnection() {
  console.log('🔍 Supabase接続テスト開始...\n');

  try {
    // 1. データベース接続テスト
    console.log('1️⃣ データベース接続テスト');
    await prisma.$connect();
    console.log('✅ Prisma接続成功\n');

    // 2. バージョン確認
    console.log('2️⃣ PostgreSQLバージョン確認');
    const version = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database version:', version[0].version.split(' ').slice(0, 2).join(' '));
    console.log('');

    // 3. テーブル存在確認
    console.log('3️⃣ テーブル存在確認');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    if (tables.length > 0) {
      console.log('✅ テーブル数:', tables.length);
      console.log('テーブル一覧:');
      tables.forEach((table, index) => {
        console.log(`   ${index + 1}. ${table.table_name}`);
      });
    } else {
      console.log('⚠️  テーブルが見つかりません。マイグレーションを実行してください。');
      console.log('   実行コマンド: npx prisma migrate deploy');
    }
    console.log('');

    // 4. ユーザー数確認（テーブルが存在する場合）
    if (tables.some(t => t.table_name === 'User')) {
      console.log('4️⃣ データ確認');
      const userCount = await prisma.user.count();
      console.log('✅ ユーザー数:', userCount);
      
      if (userCount > 0) {
        const users = await prisma.user.findMany({
          take: 3,
          select: {
            id: true,
            email: true,
            role: true,
            createdAt: true,
          },
        });
        console.log('最新ユーザー（最大3件）:');
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.email} (${user.role})`);
        });
      }
      console.log('');
    }

    // 5. 接続プールテスト
    console.log('5️⃣ 接続プール設定確認');
    const poolSize = process.env.DATABASE_URL?.includes('connection_limit=1') 
      ? '1 (Prisma推奨設定)' 
      : '未設定または複数';
    console.log('✅ Connection Limit:', poolSize);
    
    const isPgBouncer = process.env.DATABASE_URL?.includes('pgbouncer=true');
    console.log('✅ PgBouncer:', isPgBouncer ? '有効' : '無効');
    console.log('');

    // 最終結果
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Supabase接続テスト完了');
    console.log('すべてのテストに成功しました！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ エラーが発生しました:\n');
    
    if (error.code === 'P1001') {
      console.error('【接続エラー】');
      console.error('データベースに接続できません。');
      console.error('\n確認事項:');
      console.error('1. DATABASE_URLが正しく設定されているか');
      console.error('2. Supabaseプロジェクトが起動しているか');
      console.error('3. パスワードが正しいか');
      console.error('4. ファイアウォールでポート6543/5432が開いているか\n');
    } else if (error.code === 'P2021') {
      console.error('【テーブル不存在エラー】');
      console.error('テーブルが存在しません。マイグレーションを実行してください。');
      console.error('\n実行コマンド:');
      console.error('  npx prisma migrate deploy');
      console.error('または');
      console.error('  npx prisma db push\n');
    } else {
      console.error('エラー詳細:', error.message);
      if (error.meta) {
        console.error('メタ情報:', error.meta);
      }
    }
    
    console.error('\n詳細ログ:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
testSupabaseConnection()
  .catch((error) => {
    console.error('予期しないエラー:', error);
    process.exit(1);
  });
