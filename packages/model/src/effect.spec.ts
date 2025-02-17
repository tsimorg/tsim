import { registerFieldEffect } from '@tsim/model/effect';
import { Field } from '@tsim/model/field';

describe('Effect', () => {
  it('should register/apply effect', () => {
    const effect = jest.fn();

    registerFieldEffect(effect);

    class TestEntity {
      @Field(String, true)
      username!: string;
    }

    expect(TestEntity).toBeDefined();
    expect(effect).toHaveBeenCalledTimes(1);

    const [{ target, property, meta }] = effect.mock.calls[0];
    const targetName = target.constructor.name;
    expect(targetName).toEqual(TestEntity.name);
    expect(property).toEqual('username');
    expect(meta).toEqual({
      required: true,
      type: String,
      options: {
        isArray: false,
        validators: [expect.any(Function)],
      },
    });
  });
});
