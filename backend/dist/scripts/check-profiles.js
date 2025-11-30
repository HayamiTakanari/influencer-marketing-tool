"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('=== Checking Users ===');
    const users = await prisma.user.findMany({
        take: 10,
        include: {
            influencer: true,
            client: true
        }
    });
    console.log(`Total users: ${users.length}\n`);
    users.forEach((user) => {
        console.log(`User ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Role: ${user.role}`);
        if (user.influencer) {
            console.log(`  Influencer Profile:`);
            console.log(`    Display Name: ${user.influencer.displayName}`);
            console.log(`    Bio: ${user.influencer.bio ? user.influencer.bio.substring(0, 50) + '...' : 'N/A'}`);
            console.log(`    Prefecture: ${user.influencer.prefecture || 'N/A'}`);
            console.log(`    City: ${user.influencer.city || 'N/A'}`);
            console.log(`    Registered: ${user.influencer.isRegistered}`);
        }
        if (user.client) {
            console.log(`  Client Profile:`);
            console.log(`    Company: ${user.client.companyName}`);
            console.log(`    Contact: ${user.client.contactName}`);
        }
        console.log('---\n');
    });
    console.log('\n=== Checking Influencers ===');
    const influencers = await prisma.influencer.findMany({
        take: 5,
        include: {
            user: {
                select: {
                    email: true,
                    role: true
                }
            },
            socialAccounts: true,
            portfolio: true
        }
    });
    console.log(`Total influencers: ${influencers.length}\n`);
    influencers.forEach((inf) => {
        console.log(`Influencer: ${inf.displayName} (${inf.user.email})`);
        console.log(`  Social Accounts: ${inf.socialAccounts.length}`);
        console.log(`  Portfolio Items: ${inf.portfolio.length}`);
        console.log(`  Registered: ${inf.isRegistered}`);
        console.log('---\n');
    });
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=check-profiles.js.map