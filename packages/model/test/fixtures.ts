import { Field, MinLength, Model } from '../src/index';

export class Unknown {}

export class Entity extends Model {
  @Field(String, true)
  id!: string;

  @Field(Date, true)
  createdAt!: Date;

  @Field(Date, false)
  updatedAt?: Date;
}

export class Group extends Entity {
  @Field(String, true, { validators: [MinLength(3)] })
  title!: string;
}

export class User extends Entity {
  @Field(String, true, { alias: 'first_name', validators: [MinLength(4)] })
  name!: string;

  @Field(Number, true)
  age!: number;

  @Field(Boolean, true)
  isActive = false;

  @Field(Group, true, { nested: true })
  group!: Group;

  @Field([Group], true, { nested: true })
  groups!: Group[];

  @Field([Date], true)
  claims!: Date[];

  @Field(Unknown, false)
  extra?: object[];

  @Field(String, true, { exclude: true })
  password: string = 'secret';

  changePassword(value: string) {
    this.password = value;
  }
}

export const GROUP_DATA = {
  id: '1',
  createdAt: new Date().toISOString(),
  title: 'QWE',
};

export const USER_DATA = {
  id: '1',
  createdAt: new Date().toISOString(),
  first_name: 'Adam',
  age: '20',
  isActive: true,
  claims: [new Date().toISOString()],
  group: GROUP_DATA,
  groups: [
    { id: '1', createdAt: new Date().toISOString(), title: 'ABC' },
    { id: '2', createdAt: new Date().toISOString(), title: 'DEF' },
  ],
  extra: [{ id: 1 }, { id: 2 }],
};
