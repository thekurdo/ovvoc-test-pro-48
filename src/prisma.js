const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.NODE_ENV === 'test') {
  // In test mode, always create a fresh client
  prisma = new PrismaClient({
    log: [],
  });
} else {
  // In production/dev, reuse the client (singleton)
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'info', 'warn', 'error'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;