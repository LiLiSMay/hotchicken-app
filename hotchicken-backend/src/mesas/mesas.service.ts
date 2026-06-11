import {
  Injectable,
  NotFoundException,
  BadRequestException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mesa } from './mesa.entity';
import { EstadoMesa } from '../common/enums';
import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ─── DTOs inline ─────────────────────────────────────────────────────────────
export class CreateMesaDto {
  @ApiProperty({ example: 1, description: 'Número de mesa (1-50)' })
  @IsNumber()
  @Min(1)
  @Max(50)
  numero: number;
}

export class UpdateMesaEstadoDto {
  @ApiProperty({ enum: EstadoMesa })
  @IsEnum(EstadoMesa)
  estado: EstadoMesa;
}

@Injectable()
export class MesasService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Mesa)
    private readonly mesaRepository: Repository<Mesa>,
  ) {}

  /**
   * Se ejecuta automáticamente cuando el backend arranca.
   * Si no hay ninguna mesa en la BD, crea las 10 mesas iniciales.
   */
  async onApplicationBootstrap() {
    const total = await this.mesaRepository.count();
    if (total === 0) {
      console.log('🍽️  No hay mesas — creando 10 mesas automáticamente...');
      await this.inicializarMesas(10);
      console.log('✅  Mesas inicializadas correctamente.');
    }
  }

  async findAll(): Promise<Mesa[]> {
    return this.mesaRepository.find({ order: { numero: 'ASC' } });
  }

  async findOne(id: number): Promise<Mesa> {
    const mesa = await this.mesaRepository.findOne({ where: { id } });
    if (!mesa) throw new NotFoundException(`Mesa #${id} no encontrada`);
    return mesa;
  }

  async create(dto: CreateMesaDto): Promise<Mesa> {
    const existe = await this.mesaRepository.findOne({
      where: { numero: dto.numero },
    });
    if (existe) {
      throw new BadRequestException(`La mesa #${dto.numero} ya existe`);
    }
    const mesa = this.mesaRepository.create(dto);
    return this.mesaRepository.save(mesa);
  }

  async actualizarEstado(id: number, dto: UpdateMesaEstadoDto): Promise<Mesa> {
    const mesa = await this.findOne(id);
    mesa.estado = dto.estado;
    return this.mesaRepository.save(mesa);
  }

  async inicializarMesas(cantidad: number = 10): Promise<Mesa[]> {
    const creadas: Mesa[] = [];
    for (let i = 1; i <= cantidad; i++) {
      const existe = await this.mesaRepository.findOne({ where: { numero: i } });
      if (!existe) {
        const mesa = this.mesaRepository.create({ numero: i });
        creadas.push(await this.mesaRepository.save(mesa));
      }
    }
    return creadas;
  }
}
