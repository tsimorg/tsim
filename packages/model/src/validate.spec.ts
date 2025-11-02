import { User, USER_DATA } from '../test/fixtures';
import { Field } from './field';
import { deserialize } from './transform';
import {
  ArrayContains,
  ArrayMaxLength,
  ArrayMinLength,
  ArrayNotContains,
  ArrayUnique,
  IsEmail,
  IsIn,
  IsInstance,
  IsMap,
  IsObject,
  IsPattern,
  IsSet,
  Max,
  MaxLength,
  Min,
  MinLength,
  validate,
} from './validate';

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

  it('should validate IsObject', () => {
    class ModelClass {
      @Field(Object, true, { validators: [IsObject()] })
      value!: object;
    }

    const model = deserialize(ModelClass, { value: 'baz' });
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
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

  describe('ArrayMinLength', () => {
    it('should validate ArrayMinLength', () => {
      class ModelClass {
        @Field([Number], true, { arrayValidators: [ArrayMinLength(2)] })
        values!: number[];
      }

      const model = deserialize(ModelClass, { values: [1] });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('values');
    });

    it('should validate array with no errors', () => {
      class ModelClass {
        @Field([Number], true, { arrayValidators: [ArrayMinLength(2)] })
        values!: number[];
      }

      const model = deserialize(ModelClass, { values: [1, 2] });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });

  describe('ArrayMaxLength', () => {
    it('should validate ArrayMaxLength', () => {
      class ModelClass {
        @Field([Number], true, { arrayValidators: [ArrayMaxLength(2)] })
        values!: number[];
      }

      const model = deserialize(ModelClass, { values: [1, 2, 3] });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('values');
    });

    it('should validate array with no errors', () => {
      class ModelClass {
        @Field([Number], true, { arrayValidators: [ArrayMaxLength(2)] })
        values!: number[];
      }

      const model = deserialize(ModelClass, { values: [1, 2] });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });

  describe('IsEmail', () => {
    it('should validate IsEmail', () => {
      class ModelClass {
        @Field(String, true, { validators: [IsEmail()] })
        value!: string;
      }

      const model = deserialize(ModelClass, { value: 'invalid-email' });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
    });

    it('should validate IsEmail with valid email', () => {
      class ModelClass {
        @Field(String, true, { validators: [IsEmail()] })
        value!: string;
      }

      const model = deserialize(ModelClass, { value: 'test@example.com' });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });

  describe('IsPattern', () => {
    it('should validate IsPattern', () => {
      class ModelClass {
        @Field(String, true, { validators: [IsPattern(/^[a-z]+$/)] })
        value!: string;
      }

      const model = deserialize(ModelClass, { value: 'Invalid123' });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('value');
    });

    it('should validate IsPattern with valid pattern', () => {
      class ModelClass {
        @Field(String, true, { validators: [IsPattern(/^[a-z]+$/)] })
        value!: string;
      }

      const model = deserialize(ModelClass, { value: 'valid' });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });

  describe('ArrayContains', () => {
    it('should validate ArrayContains with missing item', () => {
      class ModelClass {
        @Field([String], true, { arrayValidators: [ArrayContains('foo')] })
        values!: string[];
      }

      const model = deserialize(ModelClass, { values: ['bar', 'baz'] });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('values');
    });

    it('should validate ArrayContains with present item', () => {
      class ModelClass {
        @Field([String], true, { arrayValidators: [ArrayContains('foo')] })
        values!: string[];
      }

      const model = deserialize(ModelClass, { values: ['foo', 'bar'] });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });

  describe('ArrayNotContains', () => {
    it('should validate ArrayNotContains with present item', () => {
      class ModelClass {
        @Field([String], true, { arrayValidators: [ArrayNotContains('foo')] })
        values!: string[];
      }

      const model = deserialize(ModelClass, { values: ['foo', 'bar'] });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('values');
    });

    it('should validate ArrayNotContains with missing item', () => {
      class ModelClass {
        @Field([String], true, { arrayValidators: [ArrayNotContains('foo')] })
        values!: string[];
      }

      const model = deserialize(ModelClass, { values: ['bar', 'baz'] });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });

  describe('ArrayUnique', () => {
    it('should validate ArrayUnique with duplicate items', () => {
      class ModelClass {
        @Field([String], true, { arrayValidators: [ArrayUnique()] })
        values!: string[];
      }

      const model = deserialize(ModelClass, { values: ['foo', 'bar', 'foo'] });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('values');
    });

    it('should validate ArrayUnique with unique items', () => {
      class ModelClass {
        @Field([String], true, { arrayValidators: [ArrayUnique()] })
        values!: string[];
      }

      const model = deserialize(ModelClass, { values: ['foo', 'bar', 'baz'] });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });
});
