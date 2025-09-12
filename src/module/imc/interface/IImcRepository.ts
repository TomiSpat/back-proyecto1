import { CalcularImcDto } from '../dto/calcular-imc-dto';
import { UpdateImcDto } from '../dto/update-imc-dto';
import { ImcEntity } from '../entities/imc.entity';

export interface IImcRepository {
    findBy(
        skip?: number,
        take?: number,
        order?: 'ASC' | 'DESC',
        categoria?: string,
        fechaInicio?: Date,
        fechaFin?: Date,   
    ): Promise<{ data: ImcEntity[]; total: number }>;
    findById(id: number): Promise<ImcEntity | null>;
    create(data: CalcularImcDto): Promise<ImcEntity>;
    update(id: number, data: UpdateImcDto): Promise<ImcEntity | null>;
    delete(id: number): Promise<ImcEntity | null>;
}