import { isDate } from 'lodash';
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
  });
});
