import { Module } from '@nestjs/common';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { PrismaService } from './database/prisma.service';

/**
 * SharedModule centralizes common infrastructure for all bounded contexts.
 * Must be explicitly imported by modules that need PrismaService or EventBusModule.
 *
 * Providers:
 * - PrismaService: Database connection singleton
 *
 * Exports:
 * - PrismaService: Available to importing modules
 * - EventBusModule: Event publishing infrastructure
 */
@Module({
  imports: [EventBusModule],
  providers: [PrismaService],
  exports: [EventBusModule, PrismaService],
})
export class SharedModule {}
