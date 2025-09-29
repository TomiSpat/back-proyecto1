import { ObjectId } from 'mongodb';
import { CalcularImcDto } from '../dto/calcular-imc-dto';
import { UpdateImcDto } from '../dto/update-imc-dto';
import { ImcEntity } from '../entities/imc.entity';
import { ImcMetric } from './IImcMetric';
import { ImcWeightMetric } from './IImcWeightMetric';

export interface IImcRepository {
    findBy(
        skip?: number,
        take?: number,
        order?: 'ASC' | 'DESC',
        categoria?: string,
        fechaInicio?: Date,
        fechaFin?: Date,   
    ): Promise<{ data: ImcEntity[]; total: number }>;

    findById(id: ObjectId): Promise<ImcEntity | null>;

    create(data: CalcularImcDto): Promise<ImcEntity>;

    update(id: ObjectId, data: UpdateImcDto): Promise<ImcEntity | null>;

    delete(id: ObjectId): Promise<ImcEntity | null>;

    metricsByCategoria(
        fechaInicio?: Date,
        fechaFin?: Date,
    ): Promise<ImcMetric[]>;

    pesoMetrics(
        fechaInicio?: Date,
        fechaFin?: Date,
    ): Promise<ImcWeightMetric>;
}
