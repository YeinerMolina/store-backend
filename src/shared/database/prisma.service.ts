import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { EnvKeys } from '@shared/infrastructure/config';

@Injectable()
export class PrismaService extends PrismaClient {
  constructor(private readonly config: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: config.get(EnvKeys.DATABASE_URL),
    });
    super({ adapter });
  }
}
