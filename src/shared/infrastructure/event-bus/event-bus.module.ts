import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { RedisEventBusAdapter } from './redis-event-bus.adapter';
import { redisConfig } from '../redis/redis.config';

export const EVENT_BUS_PORT_TOKEN = Symbol('EVENT_BUS_PORT');

@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [
    RedisService,
    {
      provide: EVENT_BUS_PORT_TOKEN,
      useClass: RedisEventBusAdapter,
    },
  ],
  exports: [EVENT_BUS_PORT_TOKEN, RedisService],
})
export class EventBusModule {}
