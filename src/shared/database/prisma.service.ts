import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService {
  private client: any;

  constructor() {
    // Prisma 7.x con provider legacy (prisma-client-js)
    // requiere formato datasources.db.url
    this.client = new PrismaClient(); //{ accelerateUrl: process.env.DATABASE_URL });
  }

  get prisma() {
    return this.client;
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.client.$transaction(callback);
  }
}
