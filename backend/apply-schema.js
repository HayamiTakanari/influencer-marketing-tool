const { execSync } = require('child_process');

try {
  console.log('Applying Prisma schema changes...');
  execSync('npx prisma db push', { stdio: 'inherit', cwd: '/Users/takanari/influencer-marketing-tool/backend' });
  console.log('Schema changes applied successfully!');
} catch (error) {
  console.error('Error applying schema changes:', error);
  process.exit(1);
}