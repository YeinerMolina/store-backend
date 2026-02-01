/**
 * Script de validación manual para Redis.
 * Uso: npx ts-node scripts/test-redis-connection.ts
 *
 * Verifica que:
 * 1. Redis esté corriendo
 * 2. La conexión funcione correctamente
 * 3. Pub/Sub funcione
 */

import Redis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
};

async function testRedisConnection() {
  console.log('🔌 Conectando a Redis...');
  console.log(`   Host: ${redisConfig.host}:${redisConfig.port}`);
  console.log(`   DB: ${redisConfig.db}`);
  console.log('');

  const client = new Redis(redisConfig);

  try {
    // Test 1: PING
    console.log('✅ Test 1: PING');
    const pong = await client.ping();
    console.log(`   Respuesta: ${pong}`);
    console.log('');

    // Test 2: SET/GET
    console.log('✅ Test 2: SET/GET');
    await client.set('test_key', 'test_value');
    const value = await client.get('test_key');
    console.log(`   Valor almacenado: ${value}`);
    await client.del('test_key');
    console.log('');

    // Test 3: Pub/Sub
    console.log('✅ Test 3: Pub/Sub');
    const subscriber = new Redis(redisConfig);
    const publisher = new Redis(redisConfig);

    subscriber.subscribe('domain_events:test', (err) => {
      if (err) {
        console.error('   ❌ Error al suscribirse:', err.message);
        process.exit(1);
      }
    });

    subscriber.on('message', (channel, message) => {
      console.log(`   📨 Mensaje recibido en ${channel}:`);
      console.log(`      ${message}`);

      // Cleanup
      subscriber.unsubscribe('domain_events:test');
      subscriber.quit();
      publisher.quit();
      client.quit();

      console.log('');
      console.log('🎉 Todos los tests pasaron exitosamente!');
      process.exit(0);
    });

    // Wait for subscription to be active
    await new Promise((resolve) => setTimeout(resolve, 100));

    const testEvent = {
      eventType: 'TestEvent',
      aggregateId: 'test-123',
      timestamp: new Date().toISOString(),
      data: { message: 'Hello from Redis!' },
    };

    await publisher.publish('domain_events:test', JSON.stringify(testEvent));
    console.log('   📤 Evento publicado');
  } catch (error: any) {
    console.error('');
    console.error('❌ Error:', error.message);
    console.error('');
    console.error('Asegurate que Redis esté corriendo:');
    console.error('  - Docker: docker run -d -p 6379:6379 redis:7-alpine');
    console.error('  - Local: redis-server');
    console.error('');
    client.quit();
    process.exit(1);
  }
}

testRedisConnection();
