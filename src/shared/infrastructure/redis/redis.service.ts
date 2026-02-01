import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisConfig = this.configService.get('redis');

    this.client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      retryStrategy: redisConfig.retryStrategy,
      lazyConnect: redisConfig.lazyConnect,
      connectTimeout: redisConfig.connectTimeout,
    });

    /**
     * Errors logged but don't crash app - allows graceful degradation.
     */
    this.client.on('error', (error) => {
      this.logger.error(`Connection error: ${error.message}`);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected successfully');
    });

    this.client.on('ready', () => {
      this.logger.log('Ready to accept commands');
    });
  }

  async onModuleInit() {
    try {
      await this.client.connect();
    } catch (error: any) {
      this.logger.error(`Failed to connect on init: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
    this.logger.log('Connection closed');
  }

  getClient(): Redis {
    return this.client;
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.client.ping();
      return response === 'PONG';
    } catch {
      return false;
    }
  }
}
