import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting user deletion verification...');

    // 1. Create a User
    const user = await prisma.user.create({
        data: {
            email: `test-del-${Date.now()}@example.com`,
            name: 'Deletion Test User',
            role: 'FOUNDER',
        }
    });
    console.log(`Created user: ${user.id}`);

    // 2. Create Dependent Records
    // Startup
    const startup = await prisma.startup.create({
        data: {
            name: 'Deletion Test Startup',
            stage: 'IDEA',
            pitch: 'Test pitch',
            founderId: user.id
        }
    });
    console.log(`Created startup: ${startup.id}`);

    // BlogPost
    const blogPost = await prisma.blogPost.create({
        data: {
            title: 'Deletion Test Post',
            slug: `del-test-${Date.now()}`,
            authorId: user.id
        }
    });
    console.log(`Created blog post: ${blogPost.id}`);

    // FeatureRequest
    const featureRequest = await prisma.featureRequest.create({
        data: {
            title: 'Deletion Test Feature',
            description: 'Test description',
            userId: user.id
        }
    });
    console.log(`Created feature request: ${featureRequest.id}`);

    // 3. Delete the User
    console.log('Deleting user...');
    await prisma.user.delete({
        where: { id: user.id }
    });
    console.log('User deleted.');

    // 4. Verify Records are Gone
    const userCheck = await prisma.user.findUnique({ where: { id: user.id } });
    const startupCheck = await prisma.startup.findUnique({ where: { id: startup.id } });
    const blogPostCheck = await prisma.blogPost.findUnique({ where: { id: blogPost.id } });
    const featureRequestCheck = await prisma.featureRequest.findUnique({ where: { id: featureRequest.id } });

    console.log('\nVerification Results:');
    console.log('User exists:', !!userCheck);
    console.log('Startup exists:', !!startupCheck);
    console.log('BlogPost exists:', !!blogPostCheck);
    console.log('FeatureRequest exists:', !!featureRequestCheck);

    if (!userCheck && !startupCheck && !blogPostCheck && !featureRequestCheck) {
        console.log('\nSUCCESS: All records deleted gracefully.');
    } else {
        console.error('\nFAILURE: Some records persist.');
        process.exit(1);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
