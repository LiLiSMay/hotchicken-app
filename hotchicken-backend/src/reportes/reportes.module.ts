import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { Comanda } from '../comandas/comanda.entity';
import { ItemComanda } from '../comandas/item-comanda.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Comanda, ItemComanda])],
  controllers: [ReportesController],
  providers: [ReportesService],
})
export class ReportesModule {}
