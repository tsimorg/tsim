import { isDate } from 'es-toolkit';
import { User, USER_DATA } from '../test/fixtures';
import { Field } from './field';
import { Model } from './model';
import { deserialize, serialize } from './transform';

describe('transform', () => {
  describe('serialize', () => {
    it('should serialize', () => {
      const user = User.create(USER_DATA);
      const result = serialize(user);

      expect(result).toEqual({ ...USER_DATA, age: 20 });
    });

    it('should serialize with toObject option', () => {
      class TestModel extends Model {
        @Field(Date, true, { toObject: value => (isDate(value) ? value.getTime() : value) })
        createdAt!: Date;
      }

      const model = TestModel.create({ createdAt: new Date() });
      const result = serialize(model);

      expect(result).toEqual({ createdAt: model.createdAt.getTime() });
    });

    it('should serialize a target with no registered fields', () => {
      const result = serialize({});

      expect(result).toEqual({});
    });

    it('should leave a non-array value untouched for an array field', () => {
      class TestModel extends Model {
        @Field([String], false)
        values?: string[];
      }

      const model = new TestModel();
      model.values = 'not-an-array' as unknown as string[];
      const result = serialize(model);

      expect(result).toEqual({ values: 'not-an-array' });
    });
  });

  describe('deserialize', () => {
    it('should deserialize', () => {
      const user = deserialize(User, USER_DATA);

      expect(user).toBeInstanceOf(User);
    });

    it('should deserialize with toModel option', () => {
      class TestModel extends Model {
        @Field(Date, true, { toModel: value => new Date(value as string) })
        createdAt!: Date;
      }

      const data = { createdAt: new Date().toISOString() };
      const model = deserialize(TestModel, data);

      expect(model.createdAt).toBeInstanceOf(Date);
    });

    it('should deserialize a class with no registered fields', () => {
      class Empty {}

      const model = deserialize(Empty, { foo: 'bar' });

      expect(model).toBeInstanceOf(Empty);
    });

    it('should leave a non-array value untouched for an array field', () => {
      class TestModel extends Model {
        @Field([String], false)
        values?: string[];
      }

      const model = deserialize(TestModel, { values: 'not-an-array' });

      expect(model.values).toBe('not-an-array');
    });

    it('should not convert an already correctly-typed falsy value', () => {
      class TestModel extends Model {
        @Field(Boolean, true)
        isActive!: boolean;
      }

      const model = deserialize(TestModel, { isActive: false });

      expect(model.isActive).toBe(false);
    });
  });
});
