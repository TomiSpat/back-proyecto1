import { IsNumber, IsPositive, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalcularImcDto {
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @ApiProperty({ example: 70, description: 'Peso en kilogramos' })
  peso: number;

  @IsNumber({ allowNaN: false, allowInfinity: false })
  @ApiProperty({ example: 1.75, description: 'Altura en metros' })
  altura: number;
}
