import { User, USER_DATA } from '@tsim/model-test/fixtures';
import { Field } from '@tsim/model/field';
import { deserialize } from '@tsim/model/transform';
import { IsIn, IsInstance, IsMap, IsSet, Max, MaxLength, Min, MinLength, validate } from '@tsim/model/validate';

describe('validate', () => {
  it('should validate', () => {
    const model = deserialize(User, USER_DATA);
    const errors = validate(model);

    expect(errors).toHaveLength(0);
  });

  it('should validate with errors', () => {
    const model = deserialize(User, { ...USER_DATA, age: 'foo' });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('age');
  });

  it('should validate IsIn', () => {
    class ModelClass {
      @Field(String, true, { validators: [IsIn(['foo', 'bar'])] })
      value!: string;
    }

    const model = deserialize(ModelClass, { value: 'baz' });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate IsInstance', () => {
    class ChildClass {
      @Field(String, true)
      value!: string;
    }

    class ModelClass {
      @Field(ChildClass, true, { validators: [IsInstance(ChildClass)] })
      child!: ChildClass;
    }

    const model = deserialize(ModelClass, { child: { value: '123' } });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('child');
  });

  it('should validate IsMap', () => {
    class ModelClass {
      @Field(Map, true, { validators: [IsMap()] })
      value!: Map<string, string>;
    }

    const model = deserialize(ModelClass, { value: { foo: 'bar' } });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate IsSet', () => {
    class ModelClass {
      @Field(Array, true, { validators: [IsSet()] })
      value!: Set<string>;
    }

    const model = deserialize(ModelClass, { value: { foo: 'bar' } });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate MaxLength', () => {
    class ModelClass {
      @Field(String, true, { validators: [MaxLength(2)] })
      value!: string;
    }

    const model = deserialize(ModelClass, { value: 'foo' });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate MinLength', () => {
    class ModelClass {
      @Field(String, true, { validators: [MinLength(2)] })
      value!: string;
    }

    const model = deserialize(ModelClass, { value: '1' });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate Max', () => {
    class ModelClass {
      @Field(Number, true, { validators: [Max(2)] })
      value!: number;
    }

    const model = deserialize(ModelClass, { value: 3 });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate Min', () => {
    class ModelClass {
      @Field(Number, true, { validators: [Min(2)] })
      value!: number;
    }

    const model = deserialize(ModelClass, { value: 1 });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });
});
