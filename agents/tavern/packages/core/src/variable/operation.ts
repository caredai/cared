export interface GetVariableArgs {
  key?: string
  index?: number | string
}

export function getVariable(
  variables: Record<string, any>,
  name: string,
  args: GetVariableArgs = {},
) {
  let variable = variables[args.key ?? name]
  if (args.index !== undefined) {
    try {
      variable = JSON.parse(variable)
      const numIndex = Number(args.index)
      if (Number.isNaN(numIndex)) {
        variable = variable[args.index]
      } else {
        variable = variable[Number(args.index)]
      }
      if (typeof variable == 'object') {
        variable = JSON.stringify(variable)
      }
    } catch {
      // that didn't work
    }
  }

  return variable?.trim?.() === '' || isNaN(Number(variable)) ? variable || '' : Number(variable)
}

export interface SetVariableArgs {
  index?: number | string
  as?: string
}

export function setVariable(
  variables: Record<string, any>,
  name: string,
  value: any,
  args: SetVariableArgs = {},
) {
  if (!name) {
    throw new Error('Variable name cannot be empty or undefined')
  }

  if (args.index !== undefined) {
    try {
      let variable = JSON.parse(variables[name] ?? 'null')
      const numIndex = Number(args.index)
      if (Number.isNaN(numIndex)) {
        if (variable === null) {
          variable = {}
        }
        variable[args.index] = convertValueType(value, args.as)
      } else {
        if (variable === null) {
          variable = []
        }
        variable[numIndex] = convertValueType(value, args.as)
      }
      variables[name] = JSON.stringify(variable)
    } catch {
      // that didn't work
    }
  } else {
    variables[name] = value
  }
  return value
}

export function addVariable(variables: Record<string, any>, name: string, value: any) {
  const currentValue = getVariable(variables, name) || 0
  try {
    const parsedValue = JSON.parse(currentValue)
    if (Array.isArray(parsedValue)) {
      parsedValue.push(value)
      setVariable(variables, name, JSON.stringify(parsedValue))
      return parsedValue
    }
  } catch {
    // ignore non-array values
  }
  const increment = Number(value)

  if (isNaN(increment) || isNaN(Number(currentValue))) {
    const stringValue = String(currentValue || '') + value
    setVariable(variables, name, stringValue)
    return stringValue
  }

  const newValue = Number(currentValue) + increment

  if (isNaN(newValue)) {
    return ''
  }

  setVariable(variables, name, newValue)
  return newValue
}

export function incrementVariable(variables: Record<string, any>, name: string) {
  return addVariable(variables, name, 1)
}

export function decrementVariable(variables: Record<string, any>, name: string) {
  return addVariable(variables, name, -1)
}

/**
 * Converts string to a value of a given type. Includes pythonista-friendly aliases.
 */
export function convertValueType(value: any, type?: string) {
  if (!type) {
    return value
  }

  switch (type.trim().toLowerCase()) {
    case 'string':
    case 'str':
      return String(value)

    case 'null':
      return null

    case 'undefined':
    case 'none':
      return undefined

    case 'number':
      return Number(value)

    case 'int':
      return parseInt(value, 10)

    case 'float':
      return parseFloat(value)

    case 'boolean':
    case 'bool':
      return isTrueBoolean(value)

    case 'list':
    case 'array':
      try {
        const parsedArray = JSON.parse(value)
        if (Array.isArray(parsedArray)) {
          return parsedArray
        }
        // The value is not an array
        return []
      } catch {
        return []
      }

    case 'object':
    case 'dict':
    case 'dictionary':
      try {
        const parsedObject = JSON.parse(value)
        if (typeof parsedObject === 'object') {
          return parsedObject
        }
        // The value is not an object
        return {}
      } catch {
        return {}
      }

    default:
      return value
  }
}

export function isTrueBoolean(arg: string) {
  return ['on', 'true', '1'].includes(arg.trim().toLowerCase())
}
