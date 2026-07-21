const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.employee.findMany();
  
  if (users.length === 0) {
    const newHash = await bcrypt.hash('admin12345678', 12);
    await prisma.employee.create({
      data: {
        name: 'Admin User',
        email: 'admin@bikita.it',
        passwordHash: newHash,
        role: 'ADMIN',
        department: 'IT',
        position: 'System Administrator',
      }
    });
    console.log('Created new admin user');
  } else {
    console.log('Users already exist');
  }
}

main().catch(console.error).finally(() => prisma.());
