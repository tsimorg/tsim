import { FieldEffect, FieldEffectInput } from '@tsim/model/types';

const container: { effect: FieldEffect } = {
  effect: () => {},
};

export const applyFieldEffect = (input: FieldEffectInput) => {
  container.effect(input);
};

export function registerFieldEffect(effect: FieldEffect) {
  container.effect = effect;
}
