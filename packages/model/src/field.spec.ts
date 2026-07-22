import { Dictionary, FieldMeta } from './types';
import { MinLength } from './validate';
import { Field, getTypeValidator } from './field';

function getFields(target: object): Dictionary<FieldMeta> {
  return (target as { __fields?: Dictionary<FieldMeta> }).__fields ?? {};
}

describe('getTypeValidator', () => {
  it('should return a validator for Boolean', () => {
    expect(getTypeValidator(Boolean)).toBeInstanceOf(Function);
  });

  it('should return a validator for Number', () => {
    expect(getTypeValidator(Number)).toBeInstanceOf(Function);
  });

  it('should return a validator for String', () => {
    expect(getTypeValidator(String)).toBeInstanceOf(Function);
  });

  it('should return a validator for Date', () => {
    expect(getTypeValidator(Date)).toBeInstanceOf(Function);
  });

  it('should return undefined for an unknown type', () => {
    class Custom {}

    expect(getTypeValidator(Custom)).toBeUndefined();
  });
});

describe('Field', () => {
  it('should register field metadata with a type validator', () => {
    class TestEntity {
      @Field(String, true)
      name!: string;
    }

    const fields = getFields(TestEntity.prototype);

    expect(fields).toEqual({
      name: {
        required: true,
        type: String,
        options: {
          isArray: false,
          validators: [expect.any(Function)],
        },
      },
    });
  });

  it('should mark array fields and use the element type for validation', () => {
    class TestEntity {
      @Field([Number], true)
      values!: number[];
    }

    const fields = getFields(TestEntity.prototype);

    expect(fields['values'].options?.isArray).toBe(true);
  });

  it('should prepend the type validator to custom validators', () => {
    const custom = MinLength(3);

    class TestEntity {
      @Field(String, true, { validators: [custom] })
      name!: string;
    }

    const fields = getFields(TestEntity.prototype);

    expect(fields['name'].options?.validators).toHaveLength(2);
    expect(fields['name'].options?.validators?.[1]).toBe(custom);
  });

  it('should not set a type validator for an unknown type', () => {
    class Custom {}

    class TestEntity {
      @Field(Custom, false)
      value?: Custom;
    }

    const fields = getFields(TestEntity.prototype);

    expect(fields['value'].options?.validators).toEqual([]);
  });

  it('should preserve other field options', () => {
    class TestEntity {
      @Field(String, false, { alias: 'full_name', exclude: true, groups: ['admin'] })
      name?: string;
    }

    const fields = getFields(TestEntity.prototype);

    expect(fields['name'].options?.alias).toBe('full_name');
    expect(fields['name'].options?.exclude).toBe(true);
    expect(fields['name'].options?.groups).toEqual(['admin']);
  });

  it('should not leak fields between sibling subclasses', () => {
    class Base {
      @Field(String, true)
      id!: string;
    }

    class ChildA extends Base {
      @Field(String, true)
      onlyOnA!: string;
    }

    class ChildB extends Base {
      @Field(String, true)
      onlyOnB!: string;
    }

    expect(Object.keys(getFields(Base.prototype))).toEqual(['id']);
    expect(Object.keys(getFields(ChildA.prototype))).toEqual(['id', 'onlyOnA']);
    expect(Object.keys(getFields(ChildB.prototype))).toEqual(['id', 'onlyOnB']);
  });
});
