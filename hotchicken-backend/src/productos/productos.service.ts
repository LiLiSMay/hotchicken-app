import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Producto } from './producto.entity';
import { CreateProductoDto, UpdateProductoDto } from './dto/producto.dto';
import { CategoriaProducto } from '../common/enums';

@Injectable()
export class ProductosService {
  constructor(
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
  ) {}

  async findAll(soloActivos = true): Promise<Producto[]> {
    const where = soloActivos ? { activo: true } : {};
    return this.productoRepository.find({
      where,
      order: { categoria: 'ASC', nombre: 'ASC' },
    });
  }

  async findByCategoria(categoria: CategoriaProducto): Promise<Producto[]> {
    return this.productoRepository.find({
      where: { categoria, activo: true },
    });
  }

  async findOne(id: number): Promise<Producto> {
    const producto = await this.productoRepository.findOne({ where: { id } });
    if (!producto) throw new NotFoundException(`Producto #${id} no encontrado`);
    return producto;
  }

  async create(dto: CreateProductoDto): Promise<Producto> {
    const producto = this.productoRepository.create(dto);
    return this.productoRepository.save(producto);
  }

  async update(id: number, dto: UpdateProductoDto): Promise<Producto> {
    const producto = await this.findOne(id);
    Object.assign(producto, dto);
    return this.productoRepository.save(producto);
  }

  async desactivar(id: number): Promise<Producto> {
    const producto = await this.findOne(id);
    producto.activo = false;
    return this.productoRepository.save(producto);
  }

  // ─── Seed inicial del menú HotChicken ───
  async seedMenu(): Promise<void> {
    const count = await this.productoRepository.count();
    if (count > 0) return; // Ya existe data

    const menuInicial = [
      // Platos principales
      { nombre: 'Broaster', categoria: CategoriaProducto.PLATO_PRINCIPAL, precio: 35.00 },
      { nombre: 'Spiedo', categoria: CategoriaProducto.PLATO_PRINCIPAL, precio: 38.00 },
      { nombre: 'Costillas', categoria: CategoriaProducto.PLATO_PRINCIPAL, precio: 45.00 },
      { nombre: 'Chuletas', categoria: CategoriaProducto.PLATO_PRINCIPAL, precio: 40.00 },
      // Guarniciones
      { nombre: 'Arroz', categoria: CategoriaProducto.GUARNICION, precio: 0 },
      { nombre: 'Fideo', categoria: CategoriaProducto.GUARNICION, precio: 0 },
      { nombre: 'Papa frita', categoria: CategoriaProducto.GUARNICION, precio: 5.00 },
      { nombre: 'Mixto', categoria: CategoriaProducto.GUARNICION, precio: 0 },
      // Bebidas
      { nombre: 'Refresco 2L', categoria: CategoriaProducto.BEBIDA, precio: 15.00 },
      { nombre: 'Refresco 1.5L', categoria: CategoriaProducto.BEBIDA, precio: 12.00 },
      { nombre: 'Refresco 3L', categoria: CategoriaProducto.BEBIDA, precio: 18.00 },
      { nombre: 'Personal', categoria: CategoriaProducto.BEBIDA, precio: 5.00 },
      { nombre: 'Jugo natural 1L', categoria: CategoriaProducto.BEBIDA, precio: 10.00 },
      { nombre: 'Jugo natural 2L', categoria: CategoriaProducto.BEBIDA, precio: 18.00 },
    ];

    for (const item of menuInicial) {
      const producto = this.productoRepository.create(item);
      await this.productoRepository.save(producto);
    }
  }
}
