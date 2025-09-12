Feature: CR-001 - Validación avanzada de entradas (peso/altura)
  Como usuario
  Quiero que el sistema valide correctamente el peso y la altura
  Para evitar errores en el cálculo del IMC y recibir mensajes amigables

  Background:
    Given que tengo el servicio de IMC disponible

  @valido
  Scenario: Cálculo válido dentro de rangos
    When ingreso un peso de 70 kg y una altura de 1.75 m
    Then el IMC debe ser 22.86
    And la categoría debe ser "Normal"

  @invalido
  Scenario Outline: Peso inválido (<=0 o >=500)
    When ingreso un peso de <peso> kg y una altura de 1.70 m
    Then debo ver el error "Valores inválidos: peso debe ser > 0 y < 500"
    Examples:
      | peso |
      | 0    |
      | -1   |
      | 500  |
      | 999  |

  @invalido
  Scenario Outline: Altura inválida (<=0 o >=3)
    When ingreso un peso de 70 kg y una altura de <altura> m
    Then debo ver el error "Valores inválidos: altura debe ser > 0 y < 3"
    Examples:
      | altura |
      | 0      |
      | -0.5   |
      | 3      |
      | 3.2    |

  @bordes
  Scenario Outline: Bordes de categorías válidas
    When ingreso un peso de <peso> kg y una altura de <altura> m
    Then la categoría debe ser "<categoria>"
    Examples:
      | peso | altura | categoria |
      | 50   | 1.70   | Bajo peso |
      | 68   | 1.65   | Normal    |
      | 80   | 1.70   | Sobrepeso |
      | 95   | 1.70   | Obeso     |
