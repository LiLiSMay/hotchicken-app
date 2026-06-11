import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductosService } from './productos.service';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CategoriaProducto, RolUsuario } from '../common/enums';

@ApiTags('productos')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('productos')
export class ProductosController {
  constructor(private readonly productosService: ProductosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los productos del menú' })
  @ApiQuery({ name: 'todos', required: false, type: Boolean })
  findAll(@Query('todos') todos?: boolean) {
    return this.productosService.findAll(!todos);
  }

  @Get('categoria/:categoria')
  @ApiOperation({ summary: 'Listar productos por categoría' })
  findByCategoria(@Param('categoria') categoria: CategoriaProducto) {
    return this.productosService.findByCategoria(categoria);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.findOne(id);
  }

  @Post()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear producto (solo admin)' })
  create(@Body() dto: CreateProductoDto) {
    return this.productosService.create(dto);
  }

  @Put(':id')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Actualizar producto (solo admin)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductoDto,
  ) {
    return this.productosService.update(id, dto);
  }

  @Patch(':id/desactivar')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Desactivar producto del menú' })
  desactivar(@Param('id', ParseIntPipe) id: number) {
    return this.productosService.desactivar(id);
  }

  @Post('seed')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({
    summary: 'Cargar menú inicial de HotChicken',
    description: 'Inserta los productos base si la tabla está vacía',
  })
  async seed() {
    await this.productosService.seedMenu();
    return { mensaje: 'Menú inicializado correctamente' };
  }
}
