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

  it('should validate IsBoolean with a non-boolean value', () => {
    class ModelClass {
      @Field(Boolean, true)
      value!: boolean;
    }

    const model = new ModelClass();
    model.value = 'not-a-boolean' as unknown as boolean;
    const errors = validate(model);

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('value');
  });

  it('should validate a field with no validators defined in its metadata', () => {
    class ModelClass {
      value!: string;
    }

    (ModelClass.prototype as unknown as { __fields: object }).__fields = {
      value: { required: true, type: String, options: undefined },
    };

    const model = new ModelClass();
    model.value = 'anything';
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate IsObject with a valid object', () => {
    class ModelClass {
      @Field(Object, true, { validators: [IsObject()] })
      value!: object;
    }

    const model = deserialize(ModelClass, { value: { foo: 'bar' } });
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate IsIn with an allowed value', () => {
    class ModelClass {
      @Field(String, true, { validators: [IsIn(['foo', 'bar'])] })
      value!: string;
    }

    const model = deserialize(ModelClass, { value: 'foo' });
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate IsInstance with a matching instance', () => {
    class ChildClass {
      @Field(String, true)
      value!: string;
    }

    class ModelClass {
      @Field(ChildClass, true, { validators: [IsInstance(ChildClass)], nested: true })
      child!: ChildClass;
    }

    const model = deserialize(ModelClass, { child: { value: '123' } });
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate IsMap with a Map instance', () => {
    class ModelClass {
      @Field(Map, true, { validators: [IsMap()] })
      value!: Map<string, string>;
    }

    const model = new ModelClass();
    model.value = new Map([['foo', 'bar']]);
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate IsSet with a Set instance', () => {
    class ModelClass {
      @Field(Array, true, { validators: [IsSet()] })
      value!: Set<string>;
    }

    const model = new ModelClass();
    model.value = new Set(['foo', 'bar']);
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate MaxLength with a value within the limit', () => {
    class ModelClass {
      @Field(String, true, { validators: [MaxLength(2)] })
      value!: string;
    }

    const model = deserialize(ModelClass, { value: 'ab' });
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate Max with a value within the limit', () => {
    class ModelClass {
      @Field(Number, true, { validators: [Max(2)] })
      value!: number;
    }

    const model = deserialize(ModelClass, { value: 1 });
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

  it('should validate Min with a value within the limit', () => {
    class ModelClass {
      @Field(Number, true, { validators: [Min(2)] })
      value!: number;
    }

    const model = deserialize(ModelClass, { value: 3 });
    const errors = validate(model);

    expect(errors).toHaveLength(0);
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

    it('should validate IsPattern given a string pattern', () => {
      class ModelClass {
        @Field(String, true, { validators: [IsPattern('^[a-z]+$')] })
        value!: string;
      }

      const invalid = deserialize(ModelClass, { value: 'Invalid123' });
      expect(validate(invalid)).toHaveLength(1);

      const valid = deserialize(ModelClass, { value: 'valid' });
      expect(validate(valid)).toHaveLength(0);
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

    it('should fail ArrayUnique when called with a non-array value', () => {
      const result = ArrayUnique()({ target: {}, property: 'values', value: 'not-an-array' });

      expect(result).toEqual({ message: 'Array contains duplicate items' });
    });
  });

  describe('nested validation', () => {
    it('should collect nested validation errors as children', () => {
      class Child {
        @Field(String, true, { validators: [MinLength(3)] })
        title!: string;
      }

      class Parent {
        @Field(Child, true, { nested: true })
        child!: Child;
      }

      const model = deserialize(Parent, { child: { title: 'ab' } });
      const errors = validate(model);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('child');
      expect(errors[0].children).toHaveLength(1);
      expect(errors[0].children?.[0].property).toBe('title');
    });

    it('should not add children when the nested model is valid', () => {
      class Child {
        @Field(String, true, { validators: [MinLength(3)] })
        title!: string;
      }

      class Parent {
        @Field(Child, true, { nested: true })
        child!: Child;
      }

      const model = deserialize(Parent, { child: { title: 'abc' } });
      const errors = validate(model);

      expect(errors).toHaveLength(0);
    });
  });
});
