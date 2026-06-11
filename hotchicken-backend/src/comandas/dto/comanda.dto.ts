import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoComanda, TipoPedido } from '../../common/enums';

// ─── Item dentro del pedido ───
export class CreateItemComandaDto {
  @ApiProperty({ example: 1, description: 'ID del producto' })
  @IsNumber()
  productoId: number;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  cantidad: number;

  @ApiPropertyOptional({ example: 'Papa frita', description: 'Guarnición seleccionada' })
  @IsOptional()
  @IsString()
  guarnicion?: string;

  @ApiPropertyOptional({ example: 'Pecho', description: 'Presa seleccionada' })
  @IsOptional()
  @IsString()
  presa?: string;

  @ApiPropertyOptional({ example: 'Sin sal', description: 'Notas especiales' })
  @IsOptional()
  @IsString()
  notas?: string;
}

// ─── Crear nueva comanda ───
export class CreateComandaDto {
  @ApiProperty({ enum: TipoPedido, example: TipoPedido.MESA })
  @IsEnum(TipoPedido)
  tipoPedido: TipoPedido;

  @ApiPropertyOptional({ example: 3, description: 'ID de la mesa (requerido si tipoPedido=mesa)' })
  @IsOptional()
  @IsNumber()
  mesaId?: number;

  @ApiProperty({ type: [CreateItemComandaDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateItemComandaDto)
  items: CreateItemComandaDto[];

  @ApiPropertyOptional({ example: 'Sin cebolla en los platos' })
  @IsOptional()
  @IsString()
  observaciones?: string;
}

// ─── Cambiar estado de la comanda ───
export class UpdateEstadoComandaDto {
  @ApiProperty({ enum: EstadoComanda })
  @IsEnum(EstadoComanda)
  estado: EstadoComanda;
}
