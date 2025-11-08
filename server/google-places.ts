/**
 * Google Places API (New) integration for fetching place details with parking information
 */

export interface ParkingOptions {
  freeGarageParking?: boolean;
  freeParkingLot?: boolean;
  freeStreetParking?: boolean;
  paidGarageParking?: boolean;
  paidParkingLot?: boolean;
  paidStreetParking?: boolean;
  valetParking?: boolean;
}

export interface PlaceDetails {
  name: string;
  formattedAddress: string;
  phoneNumber?: string;
  website?: string;
  openingHours?: string[];
  rating?: number;
  userRatingsTotal?: number;
  parkingOptions?: ParkingOptions;
  location: {
    latitude: number;
    longitude: number;
  };
}

/**
 * Fetch place details from Google Places API (New)
 * @param placeId - The Google Place ID
 * @param apiKey - Google Maps API key
 * @returns Place details including parking options
 */
export async function fetchPlaceDetails(
  placeId: string,
  apiKey: string
): Promise<PlaceDetails | null> {
  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    
    // Define field mask to request only needed fields
    const fields = [
      'displayName',
      'formattedAddress',
      'nationalPhoneNumber',
      'websiteUri',
      'currentOpeningHours',
      'rating',
      'userRatingCount',
      'parkingOptions',
      'location'
    ].join(',');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': fields,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Places API error:', response.status, errorText);
      return null;
    }

    const data = await response.json();

    // Transform opening hours to Japanese
    const openingHours = data.currentOpeningHours?.weekdayDescriptions?.map(
      (desc: string) => translateWeekdayToJapanese(desc)
    );

    // Transform the response to our format
    const placeDetails: PlaceDetails = {
      name: data.displayName?.text || '',
      formattedAddress: data.formattedAddress || '',
      phoneNumber: data.nationalPhoneNumber,
      website: data.websiteUri,
      openingHours,
      rating: data.rating,
      userRatingsTotal: data.userRatingCount,
      parkingOptions: data.parkingOptions,
      location: {
        latitude: data.location?.latitude || 0,
        longitude: data.location?.longitude || 0,
      },
    };

    return placeDetails;
  } catch (error) {
    console.error('Error fetching place details:', error);
    return null;
  }
}

/**
 * Convert ParkingOptions to database format (0 or 1 for each option)
 */
export function parkingOptionsToDb(parkingOptions?: ParkingOptions) {
  if (!parkingOptions) {
    return {
      freeGarageParking: null,
      freeParkingLot: null,
      freeStreetParking: null,
      paidGarageParking: null,
      paidParkingLot: null,
      paidStreetParking: null,
      valetParking: null,
    };
  }

  return {
    freeGarageParking: parkingOptions.freeGarageParking ? 1 : 0,
    freeParkingLot: parkingOptions.freeParkingLot ? 1 : 0,
    freeStreetParking: parkingOptions.freeStreetParking ? 1 : 0,
    paidGarageParking: parkingOptions.paidGarageParking ? 1 : 0,
    paidParkingLot: parkingOptions.paidParkingLot ? 1 : 0,
    paidStreetParking: parkingOptions.paidStreetParking ? 1 : 0,
    valetParking: parkingOptions.valetParking ? 1 : 0,
  };
}

/**
 * Check if a place has any parking available
 */
export function hasAnyParking(parkingOptions?: ParkingOptions): boolean {
  if (!parkingOptions) return false;
  
  return !!(
    parkingOptions.freeGarageParking ||
    parkingOptions.freeParkingLot ||
    parkingOptions.freeStreetParking ||
    parkingOptions.paidGarageParking ||
    parkingOptions.paidParkingLot ||
    parkingOptions.paidStreetParking ||
    parkingOptions.valetParking
  );
}

/**
 * Convert English weekday names to Japanese
 */
function translateWeekdayToJapanese(text: string): string {
  const dayMap: { [key: string]: string } = {
    'Monday': '月曜日',
    'Tuesday': '火曜日',
    'Wednesday': '水曜日',
    'Thursday': '木曜日',
    'Friday': '金曜日',
    'Saturday': '土曜日',
    'Sunday': '日曜日',
  };

  let translated = text;
  for (const [english, japanese] of Object.entries(dayMap)) {
    translated = translated.replace(english, japanese);
  }
  
  return translated;
}
