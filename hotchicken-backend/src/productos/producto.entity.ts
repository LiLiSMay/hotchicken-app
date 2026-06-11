import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CategoriaProducto } from '../common/enums';


@Entity('productos')
export class Producto {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombre: string;

  @Column({
    type: 'enum',
    enum: CategoriaProducto,
  })
  categoria: CategoriaProducto;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  precio: number;

  @Column({ nullable: true, length: 200 })
  descripcion: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
