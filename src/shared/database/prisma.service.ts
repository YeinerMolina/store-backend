import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaService {
  private client: any;

  constructor() {
    const { PrismaClient } = require('@prisma/client');
    this.client = new PrismaClient();
  }

  get prisma() {
    return this.client;
  }

  async transaction<T>(callback: (tx: any) => Promise<T>): Promise<T> {
    return this.client.$transaction(callback);
  }
}
