import { Global, Module } from '@nestjs/common';
import { EventBusModule } from './infrastructure/event-bus/event-bus.module';

/**
 * SharedModule centralizes common infrastructure for all bounded contexts.
 * @Global makes EVENT_BUS_PORT_TOKEN available without explicit imports.
 */
@Global()
@Module({
  imports: [EventBusModule],
  exports: [EventBusModule],
})
export class SharedModule {}
