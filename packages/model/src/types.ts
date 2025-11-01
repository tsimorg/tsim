export type Dictionary<T = unknown> = Record<string, T>;
export type ClassType<T = unknown> = { new (...args: unknown[]): T };
export type FieldsTarget = {
  __fields?: Dictionary<FieldMeta>;
};
export type FieldMeta = {
  options?: FieldMetaOptions;
  required: boolean;
  type: ClassType;
};
export type FieldMetaOptions = FieldOptions & { isArray: boolean };
export type FieldOptions = {
  alias?: string;
  arrayValidators?: ValidationFn[];
  exclude?: boolean;
  extra?: Dictionary;
  groups?: string[];
  nested?: boolean;
  toModel?: TransformFn;
  toObject?: TransformFn;
  validators?: ValidationFn[];
};
export type FieldEffect = (input: FieldEffectInput) => void;
export type FieldEffectInput = { target: object; property: string; meta: FieldMeta };
export type TransformFn = (value: unknown, data: Dictionary, property: string) => unknown;
export type ValidationParams = {
  target: object;
  property: string;
  value: unknown;
};
export type ValidationError = ValidationParams & {
  message?: string;
  params?: string[];
  children?: ValidationError[];
};
export type ValidationFn = (params: ValidationParams) => null | { message: string; params?: string[] };
