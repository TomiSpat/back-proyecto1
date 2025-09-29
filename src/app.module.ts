// app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entities } from './entities';
import { ImcModule } from './module/imc/imc.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('MONGODB_URI');
        return {
          type: 'mongodb' as const,
          url,
          database: config.get<string>('MONGODB_DB'), // Nombre de la base de datos
          useUnifiedTopology: true,     // opcional / según versión
          synchronize: config.get<string>('DB_SYNC') === 'true',
          entities: entities,
          // logging: true,
        };
      },
    }),
    TypeOrmModule.forFeature(entities), // sigue exponiendo repos
    ImcModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
