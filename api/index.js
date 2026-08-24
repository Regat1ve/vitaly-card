// Точка входа для serverless-хостинга. Приложение здесь не собирается на лету:
// esbuild, которым Vercel компилирует функции, не умеет emitDecoratorMetadata,
// а без неё NestJS не соберёт ни один провайдер. Поэтому берём уже собранный dist.
module.exports = require('../dist/serverless').handler;
