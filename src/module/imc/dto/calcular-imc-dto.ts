// src/module/imc/dto/calcular-imc-dto.ts
import { IsNumber, IsPositive, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalcularImcDto {
  @ApiProperty({ example: 70, description: 'Peso en kilogramos', minimum: 1, maximum: 500 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Min(1)
  @Max(500)
  peso: number;

  @ApiProperty({ example: 1.75, description: 'Altura en metros', minimum: 0.5, maximum: 2.7 })
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @IsPositive()
  @Min(0.5)
  @Max(2.7)
  altura: number;
}
