type GeoCoordinate = {
    latitude: number;
    longitude: number;
}

export default async function getGeoCoordinates(address: string): Promise<GeoCoordinate> {
    return fetch(`https://geocode.maps.co/search?q=${address}&api_key=${process.env.GEOCODING_MAPS_API_KEY}`)
        .then(response => response.json())
        .then(items => ({
            latitude: (parseFloat(items[0].boundingbox[0]) + parseFloat(items[0].boundingbox[1])) / 2,
            longitude: (parseFloat(items[0].boundingbox[2]) + parseFloat(items[0].boundingbox[3])) / 2
        }))
        .catch(error => ({latitude: 0, longitude: 0}));
}