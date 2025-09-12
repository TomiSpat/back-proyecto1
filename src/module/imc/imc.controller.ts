import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { ImcService } from './imc.service';
import { ParseDatePipe } from '../../common/pipes/parse-date.pipe';
import { CalcularImcDto } from './dto/calcular-imc-dto';
import { ValidarImcPipe } from 'src/common/pipes/validar-imc-pipe';

@ApiTags('IMC') // Agrupa estos endpoints bajo "IMC" en Swagger UI
@Controller('imc')
export class ImcController {
  constructor(private readonly imcService: ImcService) {}

  @Post('calcular')
  @ApiOperation({
    summary: 'Calcular IMC',
    description:
      'Recibe altura y peso, aplica validaciones, calcula el IMC y devuelve el registro resultante.',
  })
  @ApiBody({
    description: 'Datos necesarios para calcular el IMC',
    type: CalcularImcDto,
    examples: {
      normal: { summary: 'Ejemplo normal', value: { altura: 1.75, peso: 72 } },
      obeso: { summary: 'Ejemplo IMC alto', value: { altura: 1.65, peso: 95 } },
    },
  })
  @ApiCreatedResponse({
    description: 'IMC calculado correctamente',
    // Schema inline SIN clase de doc (sin $ref)
    schema: {
      type: 'object',
      properties: {
        id:       { type: 'number', example: 1 },
        peso:     { type: 'number', example: 72.5, description: 'kg' },
        altura:   { type: 'number', example: 1.75, description: 'm' },
        imc:      { type: 'number', example: 23.67, description: 'kg/m²' },
        categoria:{ type: 'string', example: 'Normal' },
        fecha:    { type: 'string', format: 'date-time', example: '2025-09-12T12:34:56.000Z' },
        // userId:   { type: ['string', 'null'], example: 'user_abc123', nullable: true },
      },
      required: ['id','peso','altura','imc','categoria','fecha'],
    },
  })
  @ApiBadRequestResponse({
    description:
      'Datos inválidos (faltan campos, tipos incorrectos o formato no válido)',
  })
  @ApiUnprocessableEntityResponse({
    description:
      'La validación de negocio del IMC falló (propia de ValidarImcPipe u otras reglas).',
  })
  async calcular(
    // El pipe custom valida reglas de dominio (rango de altura/peso, etc.)
    @Body(ValidarImcPipe) data: CalcularImcDto,
  ) {
    return await this.imcService.calcularImc(data);
  }

  @Get('historial')
  @ApiOperation({
    summary: 'Obtener historial de cálculos',
    description:
      'Devuelve un array de registros de IMC. Se puede filtrar por rango de fechas (YYYY-MM-DD).',
  })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    description: 'Fecha desde (YYYY-MM-DD)',
    example: '2025-09-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    description: 'Fecha hasta (YYYY-MM-DD)',
    example: '2025-09-12',
  })
  @ApiOkResponse({
    description: 'Listado de cálculos recuperado correctamente',
    // Array de objetos (schema inline)
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id:       { type: 'number', example: 1 },
          peso:     { type: 'number', example: 80 },
          altura:   { type: 'number', example: 1.8 },
          imc:      { type: 'number', example: 24.69 },
          categoria:{ type: 'string', example: 'Normal' },
          fecha:    { type: 'string', format: 'date-time', example: '2025-09-10T09:15:00.000Z' },
          // userId:   { type: ['string','null'], example: null, nullable: true },
        },
        required: ['id','peso','altura','imc','categoria','fecha'],
        example: {
          id: 12,
          peso: 80,
          altura: 1.8,
          imc: 24.69,
          categoria: 'Normal',
          fecha: '2025-09-10T09:15:00.000Z',
          userId: null,
        },
      },
      example: [
        {
          id: 10,
          peso: 72.5,
          altura: 1.75,
          imc: 23.67,
          categoria: 'Normal',
          fecha: '2025-09-01T10:00:00.000Z',
          userId: 'user_abc123',
        },
        {
          id: 11,
          peso: 95,
          altura: 1.65,
          imc: 34.89,
          categoria: 'Obesidad',
          fecha: '2025-09-05T09:15:00.000Z',
          userId: null,
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description:
      'Formato de fecha inválido en los parámetros (ParseDatePipe espera YYYY-MM-DD).',
  })
  async historial(
    // Convierte 'YYYY-MM-DD' a Date o lanza 400 si es inválido
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('categoria') categoria?: string,
    @Query('order') order?: 'ASC' | 'DESC',
    @Query('from', new ParseDatePipe()) fechaInicio?: Date,
    @Query('to', new ParseDatePipe()) fechaFin?: Date,
  ) {
    return await this.imcService.historial(skip, take, order, categoria,  fechaInicio, fechaFin);
  }
}

