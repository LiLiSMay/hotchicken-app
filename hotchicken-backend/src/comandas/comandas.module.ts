import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComandasController } from './comandas.controller';
import { ComandasService } from './comandas.service';
import { Comanda } from './comanda.entity';
import { ItemComanda } from './item-comanda.entity';
import { ProductosModule } from '../productos/productos.module';
import { MesasModule } from '../mesas/mesas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Comanda, ItemComanda]),
    ProductosModule,
    MesasModule,
  ],
  controllers: [ComandasController],
  providers: [ComandasService],
  exports: [ComandasService],
})
export class ComandasModule {}
