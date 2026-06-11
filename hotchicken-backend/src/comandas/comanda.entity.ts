import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { EstadoComanda, TipoPedido } from '../common/enums';
import { Usuario } from '../users/usuario.entity';
import { Mesa } from '../mesas/mesa.entity';

import { ItemComanda } from './item-comanda.entity';

/**
 * Entidad Comanda
 * Representa un pedido completo: puede ser de mesa, para llevar o delivery.
 */
@Entity('comandas')
export class Comanda {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'enum',
    enum: EstadoComanda,
    default: EstadoComanda.ABIERTA,
  })
  estado: EstadoComanda;

  @Column({
    type: 'enum',
    enum: TipoPedido,
    default: TipoPedido.MESA,
  })
  tipoPedido: TipoPedido;

  // El mesero que tomó el pedido
  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'meseroId' })
  mesero: Usuario;

  @Column({ nullable: true })
  meseroId: number;

  // La mesa (null si es para llevar o delivery)
  @ManyToOne(() => Mesa, { nullable: true, eager: true })
  @JoinColumn({ name: 'mesaId' })
  mesa: Mesa;

  @Column({ nullable: true })
  mesaId: number;

  // Los platos de la comanda
  @OneToMany(() => ItemComanda, (item) => item.comanda, {
    cascade: true,
    eager: true,
  })
  items: ItemComanda[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true, length: 300 })
  observaciones: string;

  // Indica si ya fue entregado de cocina (historial de entregados del turno)
  @Column({ default: false })
  entregadoACocina: boolean;

  // Fecha en que la comanda fue cobrada/cerrada (se setea al pasar a CERRADA)
  @Column({ type: 'timestamp', nullable: true })
  cerradoEn: Date | null;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
