import {isFunction, isObject, isString} from './utils'


export const decorateProperty = wrappedDecorate(isPropertyDecorator);
export const decorateClass = wrappedDecorate(isClassDecorator);

export function isPropertyDecorator(args) {
  return (
    args.length === 3 &&
    isObject(args[0]) &&
    isString(args[1]) &&
    isObject(args[2])
  )
}

export function isClassDecorator(args) {
  return (
    args.length === 1 &&
    isFunction(args[0])
  )
}


function wrappedDecorate(isWithNoArgs) {
  return (args, decorator) => {
    const withArgs = !isWithNoArgs(args);

    return decorate(withArgs, args, (...decArgs) => {
      const extraArgs = withArgs ? args : [];
      return decorator(...decArgs, ...extraArgs);
    });
  }
}

function decorate(withArgs, args, decorator) {
  return withArgs ? decorator : decorator(...args);
}
