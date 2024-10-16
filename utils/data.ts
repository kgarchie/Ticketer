import type { ValidationError } from "~~/types"

export function collapseStr(val: any) {
    if (typeof val !== "string") return val
    switch (true) {
        case val === "":
        case val === "null":
            return null
        case val === "true":
            return true
        case val === "false":
            return false
        case val === "undefined":
            return undefined
        default:
            return val
    }
}

export function hasOwnProperties<T = any>(obj: T, properties: (keyof T)[], allowNullish = true) {
    if (typeof obj !== "object") return false
    return properties.every((property) => {
        if (allowNullish) return obj?.hasOwnProperty(property)
        return obj?.hasOwnProperty(property) && collapseStr(obj[property]) !== null && collapseStr(obj[property]) !== undefined
    })
}

function isClientValidationError(data: any): data is ValidationError {
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data)
        } catch {
            return false
        }
    }
    return data && typeof data === 'object' && 'message' in data && 'path' in data
}


function formatValidationErrorArray(errorArray: ValidationError[]): string[] {
    return errorArray.map(error => {
        const field = error.path.join(".");
        const message = error.message;

        return `Error in "${field}": ${message}`;
    });
}

function formatErrors(data: any[]) {
    const validationErrors = [] as ValidationError[]
    const rest = [] as any[]
    data.forEach(datum => {
        if (isClientValidationError(datum)) {
            validationErrors.push(datum)
        } else {
            rest.push(datum)
        }
    })
    const join = formatValidationErrorArray(validationErrors).join("/n")
    return `${join}/n${rest.join("/n")}`
}

function formatErrorMessage(message: any) {
    if (typeof message === 'string') {
        try {
            var data = JSON.parse(message)
        } catch {
            return String(message)
        }
    }
    if (Array.isArray(data)) {
        return formatErrors(data)
    } else if (isClientValidationError(data)) {
        const field = data.path.join(".");
        const message = data.message;

        return `Error in "${field}": ${message}`;
    }

    return JSON.stringify(data)
}

export function unWrapFetchError(response: Response & { _data: any } | any, html?: true | "none") {
    let message = "Unknown error occurred";
    if (response?.response) {
        response = response.response
    }
    if (response instanceof Error) {
        return response.message
    }
    if (response?._data?.message) {
        message = formatErrorMessage(response._data.message || response?._data.statusText || response.statusText);
    } else if (response?.message) {
        message = formatErrorMessage(response.message || response.statusMessage);
    } else {
        try {
            var data = JSON.parse(data)
        } catch {
            return String(response)
        }

        message = formatErrorMessage(data);
    }

    if (html) {
        if (html === "none") {
            message = message.replace("/n", " ");
        } else {
            message = message.replace("/n", "<br>");
        }
    }

    return message
}