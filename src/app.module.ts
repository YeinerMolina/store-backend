import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InventarioModule } from './modules/inventario/infrastructure/inventario.module';

@Module({
  imports: [InventarioModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
