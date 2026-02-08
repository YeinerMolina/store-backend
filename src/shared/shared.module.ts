import { Module } from '@nestjs/common';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';
import { PrismaService } from './database/prisma.service';
import { ExceptionFiltersModule } from './filters/exception-filters.module';

@Module({
  imports: [EventBusModule, ExceptionFiltersModule],
  providers: [PrismaService],
  exports: [EventBusModule, ExceptionFiltersModule, PrismaService],
})
export class SharedModule {}
