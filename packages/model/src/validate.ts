import { ClassType, FieldMeta, FieldsTarget, ValidationError, ValidationFn, ValidationParams } from '@tsim/model/types';
import { get, isArray, isBoolean, isDate, isMap, isNaN, isNil, isNumber, isObject, isSet, isString, isUndefined } from 'lodash';

export function validate(target: object): ValidationError[] {
  const proto: FieldsTarget = target.constructor.prototype;
  const fields = proto.__fields ?? {};
  const errors: ValidationError[] = [];

  for (const [property, meta] of Object.entries(fields)) {
    const value = get(target, property);
    const params: ValidationParams = { target, property, value };
    if (meta.required || !isUndefined(value)) {
      if (meta.required) {
        const required = IsRequired()(params);
        if (required !== null) errors.push({ ...params, ...required });
      }
      if (meta.options?.isArray) {
        const arrayValid = IsArray()(params);
        if (arrayValid !== null) {
          errors.push({ ...params, ...arrayValid });
        } else if (isArray(value)) {
          if (meta.options?.arrayValidators) {
            errors.push(...validateField(params, meta, meta.options?.arrayValidators));
          }
          value.forEach(item => errors.push(...validateField({ target, property, value: item }, meta)));
        }
      } else {
        errors.push(...validateField(params, meta));
      }
      if (meta.options?.nested) {
        const nestedErrors = validate(value ?? {});
        if (nestedErrors.length) errors.push({ ...params, children: nestedErrors });
      }
    }
  }

  return errors;
}

function validateField(params: ValidationParams, meta: FieldMeta, validators: ValidationFn[] = []): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldValidators = validators.length ? validators : meta.options?.validators ?? [];
  for (const validator of fieldValidators) {
    const result = validator(params);
    if (result !== null) errors.push({ ...params, ...result });
  }
  return errors;
}

export const IsRequired =
  (): ValidationFn =>
  ({ value }) =>
    !isNil(value) ? null : { message: 'Value is required' };
export const IsArray =
  (): ValidationFn =>
  ({ value }) =>
    isArray(value) ? null : { message: 'Value is not array' };
export const IsObject =
  (): ValidationFn =>
  ({ value }) =>
    isObject(value) ? null : { message: 'Value is not object' };
export const IsIn =
  (values: unknown[]): ValidationFn =>
  ({ value }) =>
    values.includes(value) ? null : { message: 'Value is not array' };
export const IsInstance =
  (type: ClassType): ValidationFn =>
  ({ value }) =>
    value instanceof type ? null : { message: 'Value is not instanceof [0]', params: [type.name] };
export const IsBoolean =
  (): ValidationFn =>
  ({ value }) =>
    isBoolean(value) ? null : { message: 'Value is not boolean' };
export const IsNumber =
  (): ValidationFn =>
  ({ value }) =>
    isNumber(value) && !isNaN(value) ? null : { message: 'Value is not number' };
export const IsDate =
  (): ValidationFn =>
  ({ value }) =>
    isDate(value) ? null : { message: 'Value is not Date' };
export const IsMap =
  (): ValidationFn =>
  ({ value }) =>
    isMap(value) ? null : { message: 'Value is not Map' };
export const IsSet =
  (): ValidationFn =>
  ({ value }) =>
    isSet(value) ? null : { message: 'Value is not Set' };
export const IsString =
  (): ValidationFn =>
  ({ value }) =>
    isString(value) ? null : { message: 'Value is not string' };
export const MaxLength =
  (length: number): ValidationFn =>
  ({ value }) =>
    isString(value) && value.length <= length ? null : { message: 'Max length is [0]', params: [length.toString()] };
export const MinLength =
  (length: number): ValidationFn =>
  ({ value }) =>
    isString(value) && value.length >= length ? null : { message: 'Min length is [0]', params: [length.toString()] };
export const Max =
  (limit: number): ValidationFn =>
  ({ value }) =>
    isNumber(value) && value <= limit ? null : { message: 'Max value is [0]', params: [limit.toString()] };
export const Min =
  (limit: number): ValidationFn =>
  ({ value }) =>
    isNumber(value) && value >= limit ? null : { message: 'Min value is [0]', params: [limit.toString()] };
export const ArrayMinLength =
  (count: number): ValidationFn =>
  ({ value }) =>
    isArray(value) && value.length >= count ? null : { message: 'Min array length is [0]', params: [count.toString()] };
export const ArrayMaxLength =
  (count: number): ValidationFn =>
  ({ value }) =>
    isArray(value) && value.length <= count ? null : { message: 'Max array length is [0]', params: [count.toString()] };
export const ArrayContains =
  (item: unknown): ValidationFn =>
  ({ value }) =>
    isArray(value) && value.includes(item) ? null : { message: 'Array does not contain item [0]', params: [String(item)] };
export const ArrayNotContains =
  (item: unknown): ValidationFn =>
  ({ value }) =>
    isArray(value) && !value.includes(item) ? null : { message: 'Array contains forbidden item [0]', params: [String(item)] };
export const ArrayUnique =
  (): ValidationFn =>
  ({ value }) => {
    const list = isArray(value) ? value : [];
    const uniqueItems = new Set(list);
    return isArray(value) && uniqueItems.size === value.length ? null : { message: 'Array contains duplicate items' };
  };
export const IsEmail =
  (): ValidationFn =>
  ({ value }) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return isString(value) && emailRegex.test(value) ? null : { message: 'Value is not valid email' };
  };
export const IsPattern = (pattern: RegExp | string): ValidationFn => {
  const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
  return ({ value }) =>
    isString(value) && regex.test(value) ? null : { message: 'Value does not match pattern [0]', params: [pattern.toString()] };
};
