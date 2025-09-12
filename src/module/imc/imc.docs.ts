// src/module/imc/imc.docs.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImcRecordDoc {
  @ApiProperty({ example: 42 })
  id: number;

  @ApiProperty({ example: 72.5, description: 'Peso en kilogramos' })
  peso: number;

  @ApiProperty({ example: 1.75, description: 'Altura en metros' })
  altura: number;

  @ApiProperty({ example: 23.67, description: 'IMC calculado (kg/m^2)' })
  imc: number;

  @ApiProperty({
    example: 'Normal',
    description: 'Categoría según el IMC (Bajo peso, Normal, Sobrepeso, Obesidad...)',
  })
  categoria: string;

  @ApiProperty({
    example: '2025-09-12T12:34:56.000Z',
    description: 'Fecha/hora del registro (ISO8601)',
  })
  fecha: Date;

  @ApiPropertyOptional({ example: 'user_abc123', description: 'ID de usuario (si aplica)' })
  userId?: string | null;
}

export class ImcHistorialDoc {
  @ApiProperty({ type: ImcRecordDoc, isArray: true })
  data: ImcRecordDoc[];

  @ApiProperty({ example: 2 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
