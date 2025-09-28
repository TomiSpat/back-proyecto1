import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ImcEntity } from './entities/imc.entity';
import { CalcularImcDto } from './dto/calcular-imc-dto';
import { IImcRepository } from './interface/IImcRepository';
import { UpdateImcDto } from './dto/update-imc-dto';
import { ImcMetric } from './interface/IImcMetric';
import { ImcWeightMetric } from './interface/IImcWeightMetric';

@Injectable()
export class ImcRepository implements IImcRepository {
  constructor(
    @InjectRepository(ImcEntity)
    private readonly repo: Repository<ImcEntity>,
  ) { }


  async create(dto: CalcularImcDto): Promise<ImcEntity> {
    try {
      const entity = this.repo.create(dto);
      return this.repo.save(entity);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el Imc')
    }
  }

  async update(id: number, dto: UpdateImcDto): Promise<ImcEntity> {
    try {
      const entity = await this.repo.findOneBy({ id });
      if (!entity) {
        throw new Error('Imc no encontrado');
      }
      this.repo.merge(entity, dto);
      return this.repo.save(entity);
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el Imc')
    }
  }


  async findBy(
    skip: number = 0,
    take: number = 10,
    order: 'ASC' | 'DESC' = 'ASC',
    categoria: string = '',
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<{ data: ImcEntity[]; total: number }> {
    const qb = this.repo.createQueryBuilder('imc');

    if (categoria) {
      qb.andWhere('imc.categoria = :categoria', { categoria });
    }

    if (fechaInicio) {
      qb.andWhere('imc.fecha >= :fechaInicio', { fechaInicio });
    }

    if (fechaFin) {
      qb.andWhere('imc.fecha <= :fechaFin', { fechaFin });
    }

    const [data, total] = await qb
      .orderBy('imc.fecha', order)
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return { data, total };
  }


  async findById(id: number): Promise<ImcEntity | null> {
    try {
      const entity = await this.repo.findOne({ where: { id } });
      if (!entity) {
        return null;
      }
      return entity;
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar el Imc');
    }
  }

  async delete(id: number): Promise<ImcEntity | null> {
    try {
      const entity = await this.repo.findOne({ where: { id } });
      if (!entity) {
        return null;
      }
      return this.repo.remove(entity);
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el Imc');

    }
  }

  async metricsByCategoria(
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<ImcMetric[]> {
    try {
      const qb = this.repo
        .createQueryBuilder('imc')
        .select('imc.categoria', 'categoria')
        .addSelect('COUNT(*)', 'total') // Agrega una columna calculada con la cantidad de registros (COUNT(*)) y la llama 'total'
        .addSelect('AVG(imc.imc)', 'promedioImc')   // Agrega el promedio del campo 'imc' y lo llama 'promedioImc'
        .addSelect('STDDEV_POP(imc.imc)', 'variacionImc');   // Agrega la desviación estándar poblacional del campo 'imc' y lo llama 'variacionImc'

      if (fechaInicio) {
        qb.andWhere('imc.fecha >= :fechaInicio', { fechaInicio });
      }

      if (fechaFin) {
        qb.andWhere('imc.fecha <= :fechaFin', { fechaFin });
      }

      return qb
        .groupBy('imc.categoria')
        .orderBy('imc.categoria', 'ASC')
        .getRawMany();
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener métricas de IMC');
    }
  }

  async pesoMetrics(
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<ImcWeightMetric> {
    try {
      const qb = this.repo
        .createQueryBuilder('imc')
        .select('COUNT(*)', 'total')
        .addSelect('AVG(imc.peso)', 'promedioPeso')
        .addSelect('STDDEV_POP(imc.peso)', 'variacionPeso');

      if (fechaInicio) {
        qb.andWhere('imc.fecha >= :fechaInicio', { fechaInicio });
      }

      if (fechaFin) {
        qb.andWhere('imc.fecha <= :fechaFin', { fechaFin });
      }

      const row = await qb.getRawOne<{
        total: string | number;
        promedioPeso: string | number | null;
        variacionPeso: string | number | null;
      }>();

      if (!row) {
        return { total: 0, promedioPeso: null, variacionPeso: null };
      }

      return {
        total: typeof row.total === 'string' ? Number(row.total) : row.total,
        promedioPeso: row.promedioPeso === null ? null : typeof row.promedioPeso === 'string' ? Number(row.promedioPeso) : row.promedioPeso,
        variacionPeso: row.variacionPeso === null ? null : typeof row.variacionPeso === 'string' ? Number(row.variacionPeso) : row.variacionPeso,
      };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener métricas de peso');
    }
  }
}
