import { ClassType, Dictionary, FieldMeta, FieldMetaOptions, FieldOptions, FieldsTarget, ValidationFn } from '@tsim/model/types';
import { IsBoolean, IsDate, IsNumber, IsString } from '@tsim/model/validate';
import { cloneDeep, isArray } from 'lodash';

export function Field(type: ClassType | [ClassType], required: boolean, options: FieldOptions = {}): PropertyDecorator {
  return (target: FieldsTarget, propertyKey: string | symbol) => {
    const property = propertyKey.toString();
    const metaOptions: FieldMetaOptions = {
      isArray: isArray(type),
      ...options,
    };
    const metaType = isArray(type) ? type[0] : type;
    const typeValidator = getTypeValidator(metaType);
    const validators: ValidationFn[] = [];

    if (typeValidator) {
      validators.push(typeValidator);
    }

    metaOptions.validators = validators.concat(options.validators ?? []);

    const fields: Dictionary<FieldMeta> = cloneDeep(target.__fields ?? {});
    fields[property] = { required, type: metaType, options: metaOptions };
    target.__fields = fields;
  };
}

export function getTypeValidator(type: ClassType): ValidationFn | undefined {
  if (type.name === Boolean.name) {
    return IsBoolean();
  } else if (type.name === Number.name) {
    return IsNumber();
  } else if (type.name === String.name) {
    return IsString();
  } else if (type.name === Date.name) {
    return IsDate();
  }

  return;
}
