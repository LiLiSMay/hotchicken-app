import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { EstadoMesa } from '../common/enums';


@Entity('mesas')
export class Mesa {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  numero: number;

  @Column({
    type: 'enum',
    enum: EstadoMesa,
    default: EstadoMesa.LIBRE,
  })
  estado: EstadoMesa;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
