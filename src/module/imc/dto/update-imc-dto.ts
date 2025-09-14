import { PartialType } from "@nestjs/mapped-types";
import { CalcularImcDto } from "./calcular-imc-dto";

export class UpdateImcDto extends PartialType(CalcularImcDto){
    updatedAt: Date
}