import {
  IStateTreeNode, IType,
  ModelProperties,
  ModelSnapshotType,
  ModelActions,
  Instance,
  IAnyType,
} from 'mobx-state-tree'

type InstanceType_IfConstructor<T> = T extends new (...args: any) => infer R ? R : any;

export declare type ModelDecorator<T extends Function> = T & Model<T> & PropertyDecorator

export declare interface Model<T extends Function> {
  create(snapshot?: ModelSnapshotType<ModelProperties>, env?: any): IStateTreeNode<IType<any, unknown, any>> & InstanceType_IfConstructor<T>
  is(thing: any): boolean
  props<A extends (self: Instance<this>) => ModelProperties>(props: object): ModelDecorator<A>
  actions<A extends (self: Instance<this>) => ModelActions>(fn: A): ModelDecorator<A>
}

export declare type ModelOptions = {
  auto: boolean,
}
export declare function model<T extends Function>(target: T): ModelDecorator<T>
export declare function model(name?: string, options?: ModelOptions): typeof model
export declare function model(options?: ModelOptions): typeof model
export declare function prop(...args: any[]): any
export declare const view: MethodDecorator

export declare function enumeration(...args: any[]): any
export declare function _model(...args: any[]): any
export declare function compose(...args: any[]): any
export declare function custom(...args: any[]): any
export declare function reference(...args: any[]): any
export declare function safeReference(...args: any[]): any
export declare function union(...args: any[]): any
export declare function optional(...args: any[]): any
export declare function literal(...args: any[]): any
export declare function maybe(...args: any[]): any
export declare function maybeNull(...args: any[]): any
export declare function refinement(...args: any[]): any
export declare const string: PropertyDecorator
export declare const boolean: PropertyDecorator
export declare const number: PropertyDecorator
export declare const integer: PropertyDecorator
export declare const date: PropertyDecorator
export declare function map(...args: any[]): any
export declare function array(...args: any[]): any
export declare function frozen(...args: any[]): any
export declare const identifier: PropertyDecorator
export declare const identifierNumber: PropertyDecorator
export declare function late(...args: any[]): any
export declare const _undefined: PropertyDecorator
export declare const _null: PropertyDecorator
export declare function snapshotProcessor(...args: any[]): any

// alias
export declare const ref: typeof reference
export declare const safeRef: typeof safeReference
export declare const opt: typeof optional
export declare const str: typeof string
export declare const bool: typeof boolean
export declare const num: typeof number
export declare const int: typeof integer
export declare const id: typeof identifier
export declare const idNum: typeof identifierNumber
export declare const undef: typeof _undefined
export declare const nul: typeof _null
export declare const snapProc: typeof snapshotProcessor

// extra
export declare const jsonDate: PropertyDecorator
export declare const setter: PropertyDecorator

export declare const types: {
  enumeration: typeof enumeration,
  model: typeof _model,
  compose: typeof compose,
  custom: typeof custom,
  reference: typeof reference,
  safeReference: typeof safeReference,
  union: typeof union,
  optional: typeof optional,
  literal: typeof literal,
  maybe: typeof maybe,
  maybeNull: typeof maybeNull,
  refinement: typeof refinement,
  string: typeof string,
  boolean: typeof boolean,
  number: typeof number,
  integer: typeof integer,
  date: typeof date,
  map: typeof map,
  array: typeof array,
  frozen: typeof frozen,
  identifier: typeof identifier,
  identifierNumber: typeof identifierNumber,
  late: typeof late,
  undefined: typeof _undefined,
  null: typeof _null,
  snapshotProcessor: typeof snapshotProcessor,

  ref: typeof ref,
  safeRef: typeof safeRef,
  opt: typeof opt,
  str: typeof str,
  bool: typeof bool,
  num: typeof num,
  int: typeof int,
  id: typeof id,
  idNum: typeof idNum,
  undef: typeof undef,
  nul: typeof nul,
  snapProc: typeof snapProc,

  jsonDate: typeof jsonDate,
  setter: typeof setter,
}

export declare function getMstType(type: any): IAnyType
