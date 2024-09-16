export default function collectionJson(items: any[], message?: any) {
    return {
        ...(message && { message: message }),
        data: {
            length: items.length,
            items: items
        }
    }
}