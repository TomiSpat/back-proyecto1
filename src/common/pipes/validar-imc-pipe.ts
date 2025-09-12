import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { CalcularImcDto } from '../../module/imc/dto/calcular-imc-dto';

@Injectable()
export class ValidarImcPipe implements PipeTransform {
  transform(value: CalcularImcDto) {
    const { peso, altura } = value;
    if (!(peso > 0) || peso >= 500) {
      throw new BadRequestException('Valores inválidos: peso debe ser > 0 y < 500');
    }
    if (!(altura > 0) || altura >= 3) {
      throw new BadRequestException('Valores inválidos: altura debe ser > 0 y < 3');
    }
    return value;
  }
}