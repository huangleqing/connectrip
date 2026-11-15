import type {
  HotelRow,
  ItineraryDay,
  OperationKey,
  OperationLine,
  OperationSummary,
  RestaurantRow,
  FleetRow,
  SubcontractDetail,
  TourGroup,
  TourStage,
} from '@/pages/OperationCenter/data';
import { http } from '@/utils/request';

export interface OperationTourQuery {
  lineId?: number;
  stage?: TourStage;
  keyword?: string;
}

export interface CreateOperationLineParams {
  name: string;
  code: string;
  sort?: number;
  enabled?: boolean;
}

export interface UpdateOperationLineParams {
  name?: string;
  code?: string;
  sort?: number;
  enabled?: boolean;
}

export interface OperationLineQuery {
  includeDisabled?: boolean;
}

export interface CreateOperationTourParams {
  lineId: number;
  orderNo?: string;
  tourNo?: string;
  name: string;
  stage: TourStage;
  departureDate: string;
  returnDate: string;
  flightsOutbound?: string;
  flightsInbound?: string;
  source?: string;
  agency?: string;
  peopleTotal: number;
  peopleAdults: number;
  peopleChildren: number;
  owner?: string;
  assistant?: string;
  itinerary?: ItineraryDay[];
  operations?: Record<OperationKey, OperationSummary>;
  subcontract?: SubcontractDetail;
  hotels?: HotelRow[];
  restaurants?: RestaurantRow[];
  fleet?: FleetRow[];
  ticket?: string;
  visa?: string;
  scenic?: string;
  performance?: string;
  transport?: string;
}

export interface UpdateOperationTourParams {
  lineId?: number;
  name?: string;
  stage?: TourStage;
  departureDate?: string;
  returnDate?: string;
  flightsOutbound?: string;
  flightsInbound?: string;
  source?: string;
  agency?: string;
  peopleTotal?: number;
  peopleAdults?: number;
  peopleChildren?: number;
  owner?: string;
  assistant?: string;
  itinerary?: ItineraryDay[];
  operations?: Record<OperationKey, OperationSummary>;
  subcontract?: SubcontractDetail;
  hotels?: HotelRow[];
  restaurants?: RestaurantRow[];
  fleet?: FleetRow[];
  ticket?: string;
  visa?: string;
  scenic?: string;
  performance?: string;
  transport?: string;
}

export function getOperationLines(params?: OperationLineQuery) {
  return http.get<OperationLine[]>(
    '/operation/lines',
    params as Record<string, unknown> | undefined,
  );
}

export function createOperationLine(data: CreateOperationLineParams) {
  return http.post<OperationLine>('/operation/lines', data);
}

export function updateOperationLine(
  id: number,
  data: UpdateOperationLineParams,
) {
  return http.patch<OperationLine>(`/operation/lines/${id}`, data);
}

export function deleteOperationLine(id: number) {
  return http.delete<{ success: boolean; affectedTours?: number }>(
    `/operation/lines/${id}`,
  );
}

export function getOperationTours(params?: OperationTourQuery) {
  return http.get<TourGroup[]>(
    '/operation/tours',
    params as Record<string, unknown> | undefined,
  );
}

export function getOperationTour(id: number) {
  return http.get<TourGroup>(`/operation/tours/${id}`);
}

export function createOperationTour(data: CreateOperationTourParams) {
  return http.post<TourGroup>('/operation/tours', data);
}

export function updateOperationTour(
  id: number | string,
  data: UpdateOperationTourParams,
) {
  return http.patch<TourGroup>(`/operation/tours/${id}`, data);
}

export function deleteOperationTour(id: number | string) {
  return http.delete<{ success: boolean }>(`/operation/tours/${id}`);
}
