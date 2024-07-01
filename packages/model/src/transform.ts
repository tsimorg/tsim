import { ClassType, Dictionary, FieldMeta, FieldsTarget } from '@tsim/model/types';
import { get, isArray, isDate, isObject, isString, isUndefined, set } from 'lodash';

export function serialize(target: object): Dictionary {
  const record: Dictionary = {};
  const proto: FieldsTarget = target.constructor.prototype;
  const fields = proto.__fields ?? {};

  const tValue = (value: unknown, property: string, meta: FieldMeta) => {
    if (meta.options?.toObject) {
      value = meta.options.toObject(value, target as Dictionary, property);
    } else if (meta.options?.nested && isObject(value)) {
      value = serialize(value);
    } else {
      value = serializeValue(value);
    }
    return value;
  };

  for (const [property, meta] of Object.entries(fields)) {
    let value = get(target, property);
    if (isUndefined(value)) continue;
    if (meta.options?.exclude) continue;
    if (meta.options?.isArray) {
      value = isArray(value) ? value.map(item => tValue(item, property, meta)) : value;
    } else {
      value = tValue(value, property, meta);
    }

    record[meta.options?.alias ?? property] = value;
  }

  return record;
}

export function deserialize<T extends object>(cls: ClassType<T>, data: Dictionary = {}): T {
  const target = new cls({ data });
  const proto: FieldsTarget = cls.prototype;
  const fields = proto.__fields ?? {};

  const tValue = (value: unknown, property: string, meta: FieldMeta) => {
    if (meta.options?.toModel) {
      value = meta.options.toModel(value, data, property);
    } else if (meta.options?.nested) {
      value = deserialize(meta.type as ClassType<T>, value as Dictionary);
    } else if (value) {
      value = getValue(value, meta);
    }
    return value;
  };

  for (const [property, meta] of Object.entries(fields)) {
    let value = data[meta.options?.alias ?? property];
    if (isUndefined(value)) continue;
    if (meta.options?.isArray) {
      value = isArray(value) ? value.map(item => tValue(item, property, meta)) : value;
    } else {
      value = tValue(value, property, meta);
    }
    set(target, property, value);
  }

  return target;
}

function getValue(value: unknown, meta: FieldMeta): unknown {
  if (meta.type.name === Boolean.name) {
    value = Boolean(value);
  } else if (meta.type.name === Number.name) {
    value = Number(value);
  } else if (meta.type.name === String.name) {
    value = String(value);
  } else if (meta.type.name === Date.name && isString(value)) {
    value = new Date(value);
  }
  return value;
}

function serializeValue(value: unknown): unknown {
  if (isDate(value)) {
    value = value.toISOString();
  }
  return value;
}
