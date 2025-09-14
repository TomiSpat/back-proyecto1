// src/test/steps/_param_types.ts
import { defineParameterType } from '@cucumber/cucumber';

defineParameterType({
  name: 'sfloat',
  // -12, 0, 3, 3.14, -0.5, .5
  regexp: /-?(?:\d+\.?\d*|\.\d+)/,
  transformer: (s: string) => Number(s),
});
