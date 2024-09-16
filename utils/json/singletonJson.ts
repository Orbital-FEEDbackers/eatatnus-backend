export default function singletonJson(item: any, message?: any) {
    return {
        ...(message && { message: message }),
        data: item
    }
}