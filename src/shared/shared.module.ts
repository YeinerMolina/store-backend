import { Module } from '@nestjs/common';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { PrismaService } from './database/prisma.service';

/**
 * SharedModule centralizes common infrastructure for all bounded contexts.
 */
@Module({
  imports: [EventBusModule],
  providers: [PrismaService],
  exports: [EventBusModule, PrismaService],
})
export class SharedModule {}
