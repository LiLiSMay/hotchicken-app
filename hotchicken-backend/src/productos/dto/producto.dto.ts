import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CategoriaProducto } from '../../common/enums';

export class CreateProductoDto {
  @ApiProperty({ example: 'Broaster', description: 'Nombre del producto' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  @ApiProperty({ enum: CategoriaProducto, example: CategoriaProducto.PLATO_PRINCIPAL })
  @IsEnum(CategoriaProducto)
  categoria: CategoriaProducto;

  @ApiProperty({ example: 35.00, description: 'Precio en Bs.' })
  @IsNumber()
  @Min(0)
  precio: number;

  @ApiPropertyOptional({ example: 'Pollo broaster con guarnición' })
  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
