export default function errorJson(code: number, message: any) {
    return {
        error: {
            code: code,
            message: message,
        }
    }
}