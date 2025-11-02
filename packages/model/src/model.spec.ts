import { Group, GROUP_DATA, User, USER_DATA } from '../test/fixtures';
import { Model, ModelError } from './model';

describe(Model.name, () => {
  it('should create instance', () => {
    const group = Group.create(GROUP_DATA);

    expect(group).toBeInstanceOf(Group);
  });

  it('should create list of instances', () => {
    const groups = Group.createList([GROUP_DATA, GROUP_DATA]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toBeInstanceOf(Group);
    expect(groups[1]).toBeInstanceOf(Group);
  });

  it('should convert to object', () => {
    const group = Group.create(GROUP_DATA);
    const object = Group.toObject(group);

    expect(object).toEqual(GROUP_DATA);
  });

  it('should create complex instance', () => {
    const user = User.create(USER_DATA);
    user.changePassword('new-password');

    expect(user).toBeInstanceOf(User);
  });

  it('should fail to create', () => {
    expect(() => User.create({})).toThrowError('User has failed validations');
  });

  it('should get fields', () => {
    const fields = User.getFields();

    expect(fields).toHaveProperty('id');
    expect(fields).toHaveProperty('createdAt');
    expect(fields).toHaveProperty('updatedAt');
    expect(fields).toHaveProperty('name');
    expect(fields).toHaveProperty('age');
    expect(fields).toHaveProperty('isActive');
    expect(fields).toHaveProperty('group');
    expect(fields).toHaveProperty('claims');
    expect(fields).toHaveProperty('extra');
  });

  it('should get empty fields', () => {
    class Empty extends Model {}

    const fields = Empty.getFields();

    expect(fields).toEqual({});
  });

  it('should serialize error', () => {
    const error = new ModelError('User', [{ target: {}, property: 'id', value: null, message: 'Value is required' }]);

    expect(error.serialize()).toEqual('{"User":{"id":["Value is required"]}}');
  });

  it('should get response', () => {
    const error = new ModelError('User', [{ target: {}, property: 'id', value: null, message: 'Value is required' }]);

    expect(error.getResponse()).toEqual({
      statusCode: 400,
      message: 'Model Validation Exception',
      errors: { User: { id: ['Value is required'] } },
    });
  });

  it('should serialize error with children', () => {
    const error = new ModelError('User', [
      {
        target: {},
        property: 'group',
        value: null,
        message: 'Value is required',
        children: [{ target: {}, property: 'title', value: null, message: 'Value is required' }],
      },
    ]);

    expect(error.serialize()).toEqual('{"User":{"group.title":["Value is required"]}}');
  });
});
