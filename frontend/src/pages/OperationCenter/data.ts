export type TourStage =
  | 'today_depart'
  | 'tomorrow_depart'
  | 'today_return'
  | 'tomorrow_return';

export type OperationKey =
  | 'subcontract'
  | 'ticket'
  | 'visa'
  | 'hotel'
  | 'restaurant'
  | 'car'
  | 'scenic'
  | 'performance'
  | 'transport';

export type OperationState = 'not_required' | 'pending' | 'processing' | 'done';

export interface OperationSummary {
  state: OperationState;
  text: string;
}

export interface ItineraryDay {
  day: string;
  date: string;
  content: string;
}

export interface SubcontractItem {
  id: string;
  name: string;
  count: number;
  unitPrice: number;
  remark: string;
}

export interface SubcontractDetail {
  agency: string;
  region: string;
  contact: string;
  phone: string;
  fax: string;
  shopName: string;
  payment: string;
  items: SubcontractItem[];
  pickup: string;
  notice: string;
  transport: string;
}

export interface HotelRow {
  id: string;
  day: string;
  date: string;
  hotel: string;
  roomSummary: string;
  price: number;
  amount: number;
  remark: string;
  status: '待安排' | '已安排' | '已复核' | '已付款';
}

export interface RestaurantRow {
  id: string;
  day: string;
  date: string;
  meal: '早' | '中' | '晚';
  restaurant: string;
  phone: string;
  standard: number;
  staffCount: number;
  details: string;
  amount: number;
  remark: string;
  status: '待安排' | '已安排' | '已复核' | '已付款';
}

export interface FleetRow {
  id: string;
  company: string;
  vehicle: string;
  seats: number;
  dateRange: string;
  days: number;
  amount: number;
  remark: string;
  status: '待安排' | '已安排' | '已复核' | '已付款';
}

export interface OperationLine {
  id: number;
  name: string;
  code: string;
  permissionCode: string;
  sort: number;
  enabled: boolean;
  tourCount?: number;
}

export interface TourGroup {
  id: number | string;
  lineId?: number;
  line?: OperationLine;
  stage: TourStage;
  orderNo: string;
  tourNo: string;
  name: string;
  country: string;
  countryCode: string;
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
  itinerary: ItineraryDay[];
  operations: Record<OperationKey, OperationSummary>;
  subcontract: SubcontractDetail;
  hotels: HotelRow[];
  restaurants: RestaurantRow[];
  fleet: FleetRow[];
  ticket: string;
  visa: string;
  scenic: string;
  performance: string;
  transport: string;
}

export const STAGE_META: Record<
  TourStage,
  { label: string; color: string; short: string }
> = {
  today_depart: { label: '今日出团', color: 'orange', short: '今出' },
  tomorrow_depart: { label: '明日出团', color: 'blue', short: '明出' },
  today_return: { label: '今日送团', color: 'geekblue', short: '今送' },
  tomorrow_return: { label: '明日送团', color: 'purple', short: '明送' },
};

export const OPERATION_STATE_META: Record<
  OperationState,
  { label: string; color: string }
> = {
  done: { label: '已完成', color: 'success' },
  processing: { label: '进行中', color: 'processing' },
  pending: { label: '待安排', color: 'warning' },
  not_required: { label: '无需安排', color: 'default' },
};

export const RESOURCE_STATUS_COLORS: Record<string, string> = {
  待安排: 'warning',
  已安排: 'blue',
  已复核: 'processing',
  已付款: 'success',
};

export const OPERATION_META: Array<{
  key: OperationKey;
  title: string;
  tab: string;
}> = [
  { key: 'subcontract', title: '转包地接', tab: 'subcontract' },
  { key: 'ticket', title: '机票', tab: 'other' },
  { key: 'visa', title: '签证', tab: 'other' },
  { key: 'hotel', title: '房', tab: 'hotel' },
  { key: 'restaurant', title: '餐', tab: 'restaurant' },
  { key: 'car', title: '车', tab: 'fleet' },
  { key: 'scenic', title: '景', tab: 'other' },
  { key: 'performance', title: '演出', tab: 'other' },
  { key: 'transport', title: '区间交通', tab: 'other' },
];
