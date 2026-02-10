import { Module } from '@nestjs/common';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { PrismaService } from './database/prisma.service';
import { PrismaTransactionManager } from './database/transaction-manager/prisma-transaction-manager';
import { ExceptionFiltersModule } from './filters/exception-filters.module';

@Module({
  imports: [EventBusModule, ExceptionFiltersModule],
  providers: [PrismaService, PrismaTransactionManager],
  exports: [
    EventBusModule,
    ExceptionFiltersModule,
    PrismaService,
    PrismaTransactionManager,
  ],
})
export class SharedModule {}
