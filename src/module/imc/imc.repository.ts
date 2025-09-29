import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository, Repository } from 'typeorm';
import { ImcEntity } from './entities/imc.entity';
import { CalcularImcDto } from './dto/calcular-imc-dto';
import { UpdateImcDto } from './dto/update-imc-dto';
import { IImcRepository } from './interface/IImcRepository';
import { ImcMetric } from './interface/IImcMetric';
import { ImcWeightMetric } from './interface/IImcWeightMetric';
import { ObjectId } from 'mongodb';

// helper dentro del mismo archivo o importado desde utils
function toNumberOrNull(value: any): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  // BSON Decimal128 / Long / Double usually implement toString()
  if (typeof value === 'object' && typeof value.toString === 'function') {
    const s = value.toString();
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  // strings containing numbers
  if (typeof value === 'string') {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}


@Injectable()
export class ImcRepository implements IImcRepository {
  constructor(
    @InjectRepository(ImcEntity)
    private readonly repo: MongoRepository<ImcEntity>,
  ) {}

  async create(dto: CalcularImcDto): Promise<ImcEntity> {
    try {
      const entity = this.repo.create(dto);
      return await this.repo.save(entity);
    } catch (error) {
      throw new InternalServerErrorException('Error al crear el Imc');
    }
  }

  async update(id: ObjectId, dto: UpdateImcDto): Promise<ImcEntity | null> {
    try {
      const objectId = new ObjectId(id);
      const entity = await this.repo.findOneBy({ id: objectId });
      if (!entity) return null;
      this.repo.merge(entity, dto);
      return await this.repo.save(entity);
    } catch (error) {
      throw new InternalServerErrorException('Error al actualizar el Imc');
    }
  }

  async findBy(
    skip = 0,
    take = 10,
    order: 'ASC' | 'DESC' = 'ASC',
    categoria = '',
    fechaInicio?: Date,
    fechaFin?: Date,
  ): Promise<{ data: ImcEntity[]; total: number }> {
    try {
      const where: any = {};

      if (categoria) where.categoria = categoria;
      if (fechaInicio || fechaFin) {
        where.fecha = {};
        if (fechaInicio) where.fecha.$gte = fechaInicio;
        if (fechaFin) where.fecha.$lte = fechaFin;
      }

      const [data, total] = await this.repo.findAndCount({
        where,
        skip,
        take,
        order: { fecha: order },
      });

      return { data, total };
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener IMCs');
    }
  }

  async findById(id: ObjectId): Promise<ImcEntity | null> {
    try {
      const objectId = new ObjectId(id);
      return await this.repo.findOneBy({ id: objectId });
    } catch (error) {
      throw new InternalServerErrorException('Error al buscar el Imc');
    }
  }

  async delete(id: ObjectId): Promise<ImcEntity | null> {
    try {
      const objectId = new ObjectId(id);
      const entity = await this.repo.findOneBy({ id: objectId });
      if (!entity) return null;
      await this.repo.remove(entity);
      return entity;
    } catch (error) {
      throw new InternalServerErrorException('Error al eliminar el Imc');
    }
  }

async metricsByCategoria(
  fechaInicio?: Date,
  fechaFin?: Date,
): Promise<ImcMetric[]> {
  try {
    const match: any = {};
    if (fechaInicio || fechaFin) {
      match.fecha = {};
      if (fechaInicio) match.fecha.$gte = fechaInicio;
      if (fechaFin) match.fecha.$lte = fechaFin;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: '$categoria',
          total: { $sum: 1 },
          promedioImc: { $avg: '$imc' },
          variacionImc: { $stdDevPop: '$imc' },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const results = await this.repo.aggregate(pipeline).toArray();

    return results.map((r): ImcMetric => {
      const total = toNumberOrNull(r.total) ?? 0;
      const promedioRaw = toNumberOrNull(r.promedioImc);
      const variacionRaw = toNumberOrNull(r.variacionImc);

      return {
        categoria: r._id,
        total,
        // tu interfaz exige number (no nullable) => devolvemos 0 si no hay valor
        promedioImc: promedioRaw ?? 0,
        variacionImc: variacionRaw, // puede ser number | null según la interface
      };
    });
  } catch (error) {
    throw new InternalServerErrorException('Error al obtener métricas de IMC');
  }
}


async pesoMetrics(
  fechaInicio?: Date,
  fechaFin?: Date,
): Promise<ImcWeightMetric> {
  try {
    const match: any = {};
    if (fechaInicio || fechaFin) {
      match.fecha = {};
      if (fechaInicio) match.fecha.$gte = fechaInicio;
      if (fechaFin) match.fecha.$lte = fechaFin;
    }

    const pipeline = [
      { $match: match },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          promedioPeso: { $avg: '$peso' },
          variacionPeso: { $stdDevPop: '$peso' },
        },
      },
    ];

    const row = (await this.repo.aggregate(pipeline).toArray())[0];

    if (!row) {
      return { total: 0, promedioPeso: null, variacionPeso: null };
    }

    const total = toNumberOrNull(row.total) ?? 0;
    const promedioPeso = toNumberOrNull(row.promedioPeso); // puede ser null
    const variacionPeso = toNumberOrNull(row.variacionPeso); // puede ser null

    return {
      total,
      promedioPeso,
      variacionPeso,
    };
  } catch (error) {
    throw new InternalServerErrorException('Error al obtener métricas de peso');
  }
}

}
