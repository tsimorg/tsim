import { deserialize, serialize } from './transform';
import { ClassType, Dictionary, FieldMeta, ValidationError } from './types';
import { validate } from './validate';

export function create<T extends Model>(target: ClassType<T>, data: Dictionary): T {
  const model = deserialize(target, data);
  const errors = validate(model);
  if (errors.length) {
    throw new ModelError(target.name, errors);
  }
  return model;
}

export function createList<T extends Model>(target: ClassType<T>, data: Dictionary[]): T[] {
  return data.map(item => create(target, item));
}

export function toObject<T extends object>(target: T): Dictionary {
  return serialize(target);
}

export function getFields<T extends Model>(target: ClassType<T>): Dictionary<FieldMeta> {
  return target.prototype?.__fields ?? {};
}

export class Model {
  static create<T extends Model>(this: ClassType<T>, data: Dictionary): T {
    return create(this, data);
  }

  static createList<T extends Model>(this: ClassType<T>, data: Dictionary[]): T[] {
    return createList(this, data);
  }

  static toObject<T extends object>(target: T): Dictionary {
    return toObject(target);
  }

  static getFields<T extends Model>(this: ClassType<T>): Dictionary<FieldMeta> {
    return getFields(this);
  }
}

export class ModelError extends Error {
  className: string;
  errors: Dictionary<string[]> = {};

  constructor(className: string, errors: ValidationError[]) {
    super(`${className} has failed validations`);
    this.className = className;
    this.errors = this.serializeErrors(errors);
  }

  serialize(): string {
    return JSON.stringify({ [this.className]: this.errors });
  }

  serializeErrors(errors: ValidationError[]): Dictionary<string[]> {
    const result: Dictionary<string[]> = {};
    errors.forEach(error => this.getPropertyErrors(result, error));
    return result;
  }

  getResponse() {
    return {
      statusCode: 400,
      message: 'Model Validation Exception',
      errors: { [this.className]: this.errors },
    };
  }

  protected getPropertyErrors(result: Dictionary<string[]>, error: ValidationError, path = '') {
    if (error.children?.length) {
      error.children.forEach(child => this.getPropertyErrors(result, child, `${error.property}.`));
    } else {
      const messages = result[path + error.property] ?? [];
      const message = error.message ?? 'Failed validation';
      result[path + error.property] = [...messages, message];
    }
  }
}
