import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Comanda } from './comanda.entity';
import { Producto } from '../productos/producto.entity';


/**
 * Entidad ItemComanda
 * Representa un plato/bebida dentro de una comanda.
 * Guarda el precio al momento de la venta (histórico).
 */
@Entity('items_comanda')
export class ItemComanda {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Comanda, (comanda) => comanda.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comandaId' })
  comanda: Comanda;

  @Column()
  comandaId: number;

  @ManyToOne(() => Producto, { eager: true })
  @JoinColumn({ name: 'productoId' })
  producto: Producto;

  @Column()
  productoId: number;

  @Column({ default: 1 })
  cantidad: number;

  // Precio guardado al momento del pedido (por si cambia después)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precioUnitario: number;

  // Guarnición seleccionada (Arroz, Papa frita, etc.)
  @Column({ nullable: true, length: 50 })
  guarnicion: string;

  // Presa seleccionada (Pecho, Ala, Pierna)
  @Column({ nullable: true, length: 50 })
  presa: string;

  @Column({ nullable: true, length: 200 })
  notas: string;
}
