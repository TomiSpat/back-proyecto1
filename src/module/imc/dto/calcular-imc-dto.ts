// src/module/imc/dto/calcular-imc-dto.ts
import { IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalcularImcDto {
  @ApiProperty({ example: 70, description: 'Peso en kilogramos', minimum: 0.1, maximum: 499.9 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  peso: number;

  @ApiProperty({ example: 1.75, description: 'Altura en metros', minimum: 0.1, maximum: 2.9 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  altura: number;
}
