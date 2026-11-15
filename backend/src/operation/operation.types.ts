export interface OperationLineDto {
  id: number;
  name: string;
  code: string;
  permissionCode: string;
  sort: number;
  enabled: boolean;
  tourCount: number;
}

export interface TourGroupDto {
  id: number;
  lineId: number;
  line: OperationLineDto;
  country: string;
  countryCode: string;
  stage: string;
  orderNo: string;
  tourNo: string;
  name: string;
  flights: {
    outbound: string;
    inbound: string;
  };
  source: string;
  agency: string;
  people: {
    total: number;
    adults: number;
    children: number;
  };
  owner: string;
  assistant: string;
  departureDate: string;
  returnDate: string;
  itinerary: unknown;
  operations: unknown;
  subcontract: unknown;
  hotels: unknown;
  restaurants: unknown;
  fleet: unknown;
  ticket: string;
  visa: string;
  scenic: string;
  performance: string;
  transport: string;
  createdAt: string;
  updatedAt: string;
}
