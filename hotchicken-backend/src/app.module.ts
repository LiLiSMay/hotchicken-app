import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MesasModule } from './mesas/mesas.module';
import { ComandasModule } from './comandas/comandas.module';
import { ProductosModule } from './productos/productos.module';
import { ReportesModule } from './reportes/reportes.module';

@Module({
  imports: [
    // ─── Configuración de variables de entorno ───
    ConfigModule.forRoot({
      isGlobal: true,     // Disponible en todos los módulos sin necesidad de importar
      envFilePath: '.env',
    }),

    // ─── Conexión a PostgreSQL con TypeORM ───
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', ''),
        database: configService.get<string>('DB_NAME', 'hotchicken_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
        // ⚠️ En producción: synchronize: false, usar migraciones
        logging: configService.get<boolean>('DB_LOGGING', false),
      }),
      inject: [ConfigService],
    }),

    // ─── Módulos del negocio ───
    AuthModule,
    UsersModule,
    MesasModule,
    ComandasModule,
    ProductosModule,
    ReportesModule,
  ],
})
export class AppModule {}
