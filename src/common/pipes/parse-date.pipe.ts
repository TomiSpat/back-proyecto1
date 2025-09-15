import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseDatePipe implements PipeTransform {
  transform(value: any) {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`Fecha inválida: ${value}`);
    }
    return date;
  }
}
