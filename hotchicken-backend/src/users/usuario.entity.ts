import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { RolUsuario, EstadoEmpleado, EstadoSolicitud } from '../common/enums';


/**
 * Entidad Usuario
 * Representa tanto a los empleados registrados como a las solicitudes pendientes.
 * El campo estadoSolicitud controla el flujo de aprobación del dueño.
 */
@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nombreCompleto: string;

  @Column({ unique: true, length: 50 })
  username: string;

  @Column({ select: false })  // No se devuelve en consultas por defecto
  @Exclude()
  password: string;

  @Column({
    type: 'enum',
    enum: RolUsuario,
    default: RolUsuario.MESERO,
  })
  rol: RolUsuario;

  @Column({
    type: 'enum',
    enum: EstadoEmpleado,
    default: EstadoEmpleado.ACTIVO,
  })
  estado: EstadoEmpleado;

  /**
   * Estado de la solicitud de registro.
   * PENDIENTE: El mesero se registró, esperando aprobación del admin.
   * APROBADO: El admin aprobó, el usuario puede iniciar sesión.
   * RECHAZADO: El admin rechazó la solicitud.
   */
  @Column({
    type: 'enum',
    enum: EstadoSolicitud,
    default: EstadoSolicitud.PENDIENTE,
  })
  estadoSolicitud: EstadoSolicitud;

  @Column({ nullable: true, length: 200 })
  motivoRechazo: string;

  @CreateDateColumn()
  creadoEn: Date;

  @UpdateDateColumn()
  actualizadoEn: Date;
}
