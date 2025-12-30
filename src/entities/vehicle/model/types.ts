export interface Vehicle {
  id: string;
  economicNumber: string;
  brand: string;
  model: string;
  year: number;
  plates: string;
  status: 'active' | 'maintenance' | 'inactive';
  vin: string;
  currentKm: number;
}

export interface VehicleFilters {
  status?: string;
  brand?: string;
  search?: string;
}
