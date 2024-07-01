import { Field, MinLength, Model } from 'packages/model/src';

export class Unknown {}

export class Group extends Model {
  @Field(String, true, { validators: [MinLength(3)] })
  title!: string;
}

export class User extends Model {
  @Field(String, true, { alias: 'first_name', validators: [MinLength(4)] })
  name!: string;

  @Field(Number, true)
  age!: number;

  @Field(Boolean, true)
  isActive!: boolean;

  @Field(Date, false)
  createdAt?: Date;

  @Field(Group, true, { nested: true })
  group!: Group;

  @Field([Date], true)
  claims!: Date[];

  @Field(Unknown, true)
  extra!: object[];

  @Field(String, true, { exclude: true })
  password: string = 'secret';

  changePassword(value: string) {
    this.password = value;
  }
}
