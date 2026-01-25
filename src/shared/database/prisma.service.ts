import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient {
  private client: any;

  constructor() {
    const adapter = new PrismaPg({});
    super({ adapter });
  }

  get prisma() {
    return this.client;
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.client.$transaction(callback);
  }
}
