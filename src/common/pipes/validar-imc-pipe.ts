import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CalcularImcDto } from '../../module/imc/dto/calcular-imc-dto';

@Injectable()
export class ValidarImcPipe implements PipeTransform {
  transform(value: CalcularImcDto) {
    const { peso, altura } = value;
    if (!(peso > 0) || peso >= 500) {
      throw new BadRequestException('Valores inválidos: peso debe ser mayor a 0 y menor a 500');
    }
    if (!(altura > 0) || altura >= 3) {
      throw new BadRequestException('Valores inválidos: altura debe ser mayor a 0 y menor a 3');
    }
    return value;
  }
}