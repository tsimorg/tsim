import { Group, User } from '../test/fixtures';

describe('model', () => {
  it('should create instance', () => {
    const group = Group.create({ title: 'QWE' });

    expect(group).toBeInstanceOf(Group);
  });

  it('should create complex instance', () => {
    const user = User.create({
      first_name: 'Adam',
      age: '20',
      isActive: true,
      claims: [new Date()],
      group: { title: 'ASD' },
      groups: [{ title: 'ASD' }, { title: 'QWE' }],
      extra: [{ id: 1 }, { id: 2 }],
    });

    expect(user).toBeInstanceOf(User);
  });
});
