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
        // Si existe DATABASE_URL (en Render), la usa directamente. Si no, usa el desglose (en tu localhost)
        url: configService.get<string>('DATABASE_URL'),
        host: !configService.get<string>('DATABASE_URL') ? configService.get<string>('DB_HOST', 'localhost') : undefined,
        port: !configService.get<string>('DATABASE_URL') ? configService.get<number>('DB_PORT', 5432) : undefined,
        username: !configService.get<string>('DATABASE_URL') ? configService.get<string>('DB_USERNAME', 'postgres') : undefined,
        password: !configService.get<string>('DATABASE_URL') ? configService.get<string>('DB_PASSWORD', '') : undefined,
        database: !configService.get<string>('DATABASE_URL') ? configService.get<string>('DB_NAME', 'hotchicken_db') : undefined,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', true),
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
export class AppModule { }
