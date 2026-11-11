import dayjs from 'dayjs';

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

export interface TourGroup {
  id: string;
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

export const COUNTRY_FILTERS = [
  '全部',
  '票务',
  '重庆',
  '老挝-LAO',
  '越南-VNM',
  '泰国-THA',
  '法国-FRA',
  '新加坡-SIN',
  '阿联酋-UAE',
  '马来西亚-MYS',
  '蒙古国-MNG',
  '个人业务-PB',
  '中国台湾',
  'MYA-缅甸',
  '英国-UK',
  '文莱-BN',
  '加拿大-CA',
  '意大利-ITA',
];

const ADDITIONAL_COUNTRIES = [
  { country: '重庆', code: 'CKG' },
  { country: '越南-VNM', code: 'VNM' },
  { country: '新加坡-SIN', code: 'SIN' },
  { country: '法国-FRA', code: 'FRA' },
];

function formatDate(value: dayjs.Dayjs) {
  return value.format('YYYY-MM-DD');
}

function buildItinerary(
  departureDate: string,
  days: number,
  country: string,
  custom?: Array<{ date?: string; content: string }>,
): ItineraryDay[] {
  return Array.from({ length: days }, (_, index) => {
    const date = custom?.[index]?.date ?? dayjs(departureDate).add(index, 'day').format('MM.DD');
    const content =
      custom?.[index]?.content ??
      (index === 0
        ? `出发前往${country}，抵达后入住酒店休息`
        : index === days - 1
          ? '整理行李，前往机场，结束愉快旅程'
          : `${country}经典行程 · 第 ${index + 1} 天：城市观光与特色体验`);
    return {
      day: `D${index + 1}`,
      date,
      content,
    };
  });
}

function buildHotels(
  itinerary: ItineraryDay[],
  hotelName: string,
  people: TourGroup['people'],
  price: number,
): HotelRow[] {
  return itinerary.slice(0, -1).map((day, index) => ({
    id: `hotel-${day.day}`,
    day: day.day,
    date: day.date,
    hotel: index === 0 ? hotelName : `${hotelName}（第 ${index + 1} 晚）`,
    roomSummary: `${people.adults}大${people.children}小 + 1司导房`,
    price,
    amount: price * Math.max(1, Math.ceil(people.total / 2)),
    remark: index === 0 ? '客户指定酒店，要求闹市区' : '标准双床房',
    status: index === itinerary.length - 2 ? '已复核' : '已安排',
  }));
}

function buildRestaurants(
  itinerary: ItineraryDay[],
  hotelName: string,
): RestaurantRow[] {
  const rows: RestaurantRow[] = [];
  const lunchSpots = ['黑大兔', '山城老火锅', '江湖菜馆', '重庆小面'];
  const dinnerSpots = ['朝天门火锅', '十八梯家常菜', '解放碑烤鱼'];
  itinerary.forEach((day, index) => {
    rows.push({
      id: `meal-${day.day}-breakfast`,
      day: day.day,
      date: day.date,
      meal: '早',
      restaurant: hotelName,
      phone: '—',
      standard: 0,
      staffCount: 1,
      details: '酒店含早',
      amount: 0,
      remark: '按酒店早餐标准',
      status: '已安排',
    });
    if (index !== 0) {
      rows.push({
        id: `meal-${day.day}-lunch`,
        day: day.day,
        date: day.date,
        meal: '中',
        restaurant: lunchSpots[index % lunchSpots.length],
        phone: '13618789542',
        standard: 25,
        staffCount: 2,
        details: '客人 1 桌',
        amount: 500,
        remark: '老挝客人：少油少盐，不要辣椒和内脏',
        status: index === 1 ? '待安排' : '已安排',
      });
    }
    if (index < itinerary.length - 1) {
      rows.push({
        id: `meal-${day.day}-dinner`,
        day: day.day,
        date: day.date,
        meal: '晚',
        restaurant: dinnerSpots[index % dinnerSpots.length],
        phone: '023-63886666',
        standard: 35,
        staffCount: 2,
        details: '客人 1 桌',
        amount: 600,
        remark: '需包房',
        status: '已安排',
      });
    }
  });
  return rows;
}

function buildSubcontract(
  tourNo: string,
  people: TourGroup['people'],
  agency: string,
): SubcontractDetail {
  return {
    agency,
    region: '重庆',
    contact: '张三',
    phone: '13618789542',
    fax: '',
    shopName: '重庆海外旅行社有限公司',
    payment: '默认付款',
    items: [
      {
        id: 'adult',
        name: '大人',
        count: people.adults,
        unitPrice: 0,
        remark: '',
      },
      {
        id: 'child',
        name: '小孩',
        count: people.children,
        unitPrice: 0,
        remark: '',
      },
      { id: 'guide', name: '全陪', count: 1, unitPrice: 0, remark: '' },
      { id: 'single', name: '单房差', count: 0, unitPrice: 0, remark: '' },
    ],
    pickup: `接 ${people.total} 位贵宾`,
    notice: `${tourNo} 团队，请提前确认接站信息`,
    transport: '去程：按航班抵达时间接机；回程：提前 3 小时送机',
  };
}

interface TourSeed {
  id: string;
  stage: TourStage;
  name: string;
  country: string;
  countryCode: string;
  orderNo: string;
  tourNo: string;
  flights: TourGroup['flights'];
  source: string;
  agency: string;
  people: TourGroup['people'];
  owner: string;
  assistant: string;
  days: number;
  itineraryCustom?: Array<{ date?: string; content: string }>;
  hotelName: string;
  hotelPrice: number;
  operations?: Partial<Record<OperationKey, OperationSummary>>;
  ticket?: string;
  visa?: string;
  scenic?: string;
  performance?: string;
  transport?: string;
}

function stageDeparture(stage: TourStage, days: number) {
  const today = dayjs();
  if (stage === 'today_depart') return today;
  if (stage === 'tomorrow_depart') return today.add(1, 'day');
  if (stage === 'today_return') return today.subtract(days - 1, 'day');
  return today.subtract(days - 2, 'day');
}

function createTour(seed: TourSeed): TourGroup {
  const departure = stageDeparture(seed.stage, seed.days);
  const returnDate = departure.add(seed.days - 1, 'day');
  const departureDate = formatDate(departure);
  const itinerary = buildItinerary(
    departureDate,
    seed.days,
    seed.country.split('-')[0],
    seed.itineraryCustom,
  );
  const hotels = buildHotels(itinerary, seed.hotelName, seed.people, seed.hotelPrice);
  const restaurants = buildRestaurants(itinerary, seed.hotelName);
  const defaultOperations: Record<OperationKey, OperationSummary> = {
    subcontract: { state: 'done', text: '已安排' },
    ticket: { state: 'done', text: '已出票' },
    visa: { state: 'processing', text: '已送签' },
    hotel: { state: 'done', text: `${hotels.length}晚已安排` },
    restaurant: { state: 'processing', text: '安排中' },
    car: { state: 'done', text: '已安排' },
    scenic: { state: 'done', text: '已确认' },
    performance: { state: 'pending', text: '待安排' },
    transport: { state: 'processing', text: '出票中' },
  };
  const operations = {
    ...defaultOperations,
    ...seed.operations,
  };

  return {
    id: seed.id,
    stage: seed.stage,
    orderNo: seed.orderNo,
    tourNo: seed.tourNo,
    name: seed.name,
    country: seed.country,
    countryCode: seed.countryCode,
    flights: seed.flights,
    source: seed.source,
    agency: seed.agency,
    people: seed.people,
    owner: seed.owner,
    assistant: seed.assistant,
    departureDate,
    returnDate: formatDate(returnDate),
    itinerary,
    operations,
    subcontract: buildSubcontract(seed.tourNo, seed.people, seed.agency),
    hotels,
    restaurants,
    fleet: [
      {
        id: `fleet-${seed.id}`,
        company: '重庆渝运旅游车队',
        vehicle: '38 座旅游大巴',
        seats: 38,
        dateRange: `${departure.format('MM.DD')}-${returnDate.format('MM.DD')}`,
        days: seed.days,
        amount: seed.days * 1800,
        remark: '要求 1 年内新车，含司机餐补',
        status: seed.stage === 'today_return' ? '已付款' : '已安排',
      },
    ],
    ticket: seed.ticket ?? '已出票，票务成本待财务复核',
    visa: seed.visa ?? '12 人团签，2 人个签，1 人免签',
    scenic: seed.scenic ?? '金佛山巴士 + 索道 + 山顶观光车 + 含滑雪场',
    performance: seed.performance ?? '周六无人街表演，按实际场次确认',
    transport: seed.transport ?? '10:30 沙坪坝—成都东 G8662，13:52—15:02',
  };
}

const TODAY = dayjs().format('YYYYMMDD');

const tours: TourGroup[] = [
  createTour({
    id: 'laos-wulong',
    stage: 'today_depart',
    name: '老挝重庆武隆5日游',
    country: '老挝-LAO',
    countryCode: 'LAO',
    orderNo: `${TODAY}MYS`,
    tourNo: 'PTCKG-261015-HU',
    flights: {
      outbound: '来程：吉隆坡-重庆，HU7924，14:15/18:55',
      inbound: '回程：重庆-吉隆坡，HU7923，08:00/13:05',
    },
    source: '老挝',
    agency: '老挝高登',
    people: { total: 15, adults: 12, children: 3 },
    owner: '林悦',
    assistant: '肖雨',
    days: 6,
    itineraryCustom: [
      { content: '吉隆坡-重庆，HU7924，1415/1855；抵达后前往酒店，入住休息' },
      {
        content:
          '动物园(熊猫馆)、黄角坪涂鸦一条街、鹅岭二厂文创公园、云端之眼、来福士朝天门广场、李子坝观景台',
      },
      {
        content: '磁器口古镇、下浩里、龙门浩老街、长嘉汇公园、弹子石老街、无人街表演',
      },
      { content: '乳胶、十八梯、解放碑步行街、八一路好吃街、夜游洪崖洞' },
      { content: '超市、百年茶馆、山城步道、魁星楼' },
      { content: '重庆-吉隆坡 HU7923，0800/1305，以最终时间为准，送机' },
    ],
    hotelName: '重庆康铂酒店',
    hotelPrice: 180,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'processing', text: '已送签' },
      hotel: { state: 'done', text: '5晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '4天已安排' },
      scenic: { state: 'done', text: '6项已订' },
      performance: { state: 'pending', text: '待安排' },
      transport: { state: 'processing', text: '出票中' },
    },
    ticket: '出票需求：1 婴儿票，儿童票 3 张，已出票',
    visa: '12 人团签，2 人个签，1 人免签，10.28 前出签',
    scenic: '1月21日 金佛山巴士 + 索道 + 山顶观光车 + 滑雪场',
    performance: '周六无人街表演，需确认场次',
    transport: '10:30 沙坪坝—成都东 G8662，13:52-15:02',
  }),
  createTour({
    id: 'thai-jiuzhai',
    stage: 'tomorrow_depart',
    name: '泰国重庆四川九寨沟9日游',
    country: '泰国-THA',
    countryCode: 'THA',
    orderNo: `${dayjs().add(1, 'day').format('YYYYMMDD')}THA`,
    tourNo: 'PTCKG-261016-TG',
    flights: {
      outbound: '来程：曼谷-重庆，TG860，14:20/18:20',
      inbound: '回程：成都-曼谷，TG861，15:30/17:40',
    },
    source: '泰国',
    agency: '泰国金旅',
    people: { total: 22, adults: 18, children: 4 },
    owner: '陈远',
    assistant: '何雨',
    days: 9,
    hotelName: '九寨沟喜来登国际大酒店',
    hotelPrice: 320,
    operations: {
      subcontract: { state: 'processing', text: '安排中' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'processing', text: '签证中' },
      hotel: { state: 'processing', text: '确认中' },
      restaurant: { state: 'pending', text: '待安排' },
      car: { state: 'pending', text: '待安排' },
      scenic: { state: 'processing', text: '确认中' },
      performance: { state: 'pending', text: '待安排' },
      transport: { state: 'pending', text: '待安排' },
    },
  }),
  createTour({
    id: 'malaysia-chongqing',
    stage: 'today_return',
    name: '马来西亚渝见重庆8日游',
    country: '马来西亚-MYS',
    countryCode: 'MYS',
    orderNo: `${dayjs().subtract(7, 'day').format('YYYYMMDD')}MYS`,
    tourNo: 'PTCKG-260401-MY',
    flights: {
      outbound: '来程：吉隆坡-重庆，MH382，13:10/18:05',
      inbound: '回程：重庆-吉隆坡，MH383，09:30/14:20',
    },
    source: '马来西亚',
    agency: '马来西亚阳光假期',
    people: { total: 18, adults: 15, children: 3 },
    owner: '苏晴',
    assistant: '李妍',
    days: 8,
    hotelName: '重庆解放碑威斯汀酒店',
    hotelPrice: 260,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'done', text: '已交接' },
      hotel: { state: 'done', text: '7晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'done', text: '已订' },
      transport: { state: 'done', text: '已出票' },
    },
  }),
  createTour({
    id: 'uae-dubai',
    stage: 'tomorrow_return',
    name: '阿联酋迪拜奢华7日游',
    country: '阿联酋-UAE',
    countryCode: 'UAE',
    orderNo: `${dayjs().subtract(5, 'day').format('YYYYMMDD')}UAE`,
    tourNo: 'PTCKG-260406-AE',
    flights: {
      outbound: '来程：迪拜-重庆，CZ3042，22:00/08:20+1',
      inbound: '回程：重庆-迪拜，CZ3041，14:30/19:20',
    },
    source: '阿联酋',
    agency: '迪拜星辰国际',
    people: { total: 12, adults: 10, children: 2 },
    owner: '周航',
    assistant: '赵敏',
    days: 7,
    hotelName: '迪拜市中心酒店',
    hotelPrice: 680,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'done', text: '已出签' },
      hotel: { state: 'done', text: '6晚已安排' },
      restaurant: { state: 'processing', text: '复核中' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'done', text: '已订' },
      transport: { state: 'processing', text: '待确认' },
    },
  }),
  createTour({
    id: 'singapore-family',
    stage: 'today_depart',
    name: '新加坡亲子6日游',
    country: '新加坡-SIN',
    countryCode: 'SIN',
    orderNo: `${TODAY}SIN`,
    tourNo: 'PTCKG-261015-SG',
    flights: {
      outbound: '来程：新加坡-重庆，SQ818，12:00/16:30',
      inbound: '回程：重庆-新加坡，SQ819，13:20/18:00',
    },
    source: '新加坡',
    agency: '新加坡华运',
    people: { total: 9, adults: 7, children: 2 },
    owner: '孙悦',
    assistant: '陈曦',
    days: 6,
    hotelName: '重庆来福士洲际酒店',
    hotelPrice: 520,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'done', text: '免签' },
      hotel: { state: 'done', text: '5晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'pending', text: '待安排' },
      transport: { state: 'done', text: '已出票' },
    },
  }),
  createTour({
    id: 'france-vietnam',
    stage: 'tomorrow_depart',
    name: '法国越南连线10日游',
    country: '法国-FRA',
    countryCode: 'FRA',
    orderNo: `${dayjs().add(1, 'day').format('YYYYMMDD')}FRA`,
    tourNo: 'PTCKG-261016-FR',
    flights: {
      outbound: '去程：巴黎-重庆，AF116，21:30/18:00+1',
      inbound: '回程：重庆-巴黎，AF117，09:00/14:00',
    },
    source: '法国',
    agency: '法国欧之旅',
    people: { total: 16, adults: 14, children: 2 },
    owner: '李楠',
    assistant: '张琪',
    days: 10,
    hotelName: '重庆尼依格罗酒店',
    hotelPrice: 480,
    operations: {
      subcontract: { state: 'pending', text: '待安排' },
      ticket: { state: 'processing', text: '出票中' },
      visa: { state: 'done', text: '已出签' },
      hotel: { state: 'pending', text: '待安排' },
      restaurant: { state: 'pending', text: '待安排' },
      car: { state: 'pending', text: '待安排' },
      scenic: { state: 'pending', text: '待安排' },
      performance: { state: 'not_required', text: '无需安排' },
      transport: { state: 'pending', text: '待安排' },
    },
  }),
  createTour({
    id: 'vietnam-halong',
    stage: 'today_return',
    name: '越南下龙湾6日游',
    country: '越南-VNM',
    countryCode: 'VNM',
    orderNo: `${dayjs().subtract(5, 'day').format('YYYYMMDD')}VNM`,
    tourNo: 'PTCKG-260409-VN',
    flights: {
      outbound: '来程：河内-重庆，VN720，11:30/15:20',
      inbound: '回程：重庆-河内，VN721，16:20/18:30',
    },
    source: '越南',
    agency: '越南越美国际',
    people: { total: 20, adults: 17, children: 3 },
    owner: '王涛',
    assistant: '何雨',
    days: 6,
    hotelName: '重庆洪崖洞大酒店',
    hotelPrice: 220,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'done', text: '已交接' },
      hotel: { state: 'done', text: '5晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'done', text: '已订' },
      transport: { state: 'done', text: '已出票' },
    },
  }),
  createTour({
    id: 'chongqing-incentive',
    stage: 'tomorrow_return',
    name: '重庆企业奖励旅游5日游',
    country: '重庆',
    countryCode: 'CKG',
    orderNo: `${dayjs().subtract(3, 'day').format('YYYYMMDD')}CKG`,
    tourNo: 'PTCKG-260410-CQ',
    flights: {
      outbound: '来程：上海-重庆，MU5423，09:00/12:00',
      inbound: '回程：重庆-上海，MU5424，18:00/20:30',
    },
    source: '中国',
    agency: '上海会奖旅行社',
    people: { total: 32, adults: 30, children: 2 },
    owner: '陈远',
    assistant: '赵敏',
    days: 5,
    hotelName: '重庆悦来温德姆酒店',
    hotelPrice: 380,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'not_required', text: '无需' },
      hotel: { state: 'done', text: '4晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'done', text: '已订' },
      transport: { state: 'done', text: '已出票' },
    },
  }),
  createTour({
    id: 'italy-rome',
    stage: 'today_depart',
    name: '意大利罗马深度8日游',
    country: '意大利-ITA',
    countryCode: 'ITA',
    orderNo: `${TODAY}ITA`,
    tourNo: 'PTCKG-261015-IT',
    flights: {
      outbound: '来程：罗马-重庆，AZ790，20:00/15:30+1',
      inbound: '回程：重庆-罗马，AZ791，11:00/16:30',
    },
    source: '意大利',
    agency: '意大利美好假期',
    people: { total: 11, adults: 9, children: 2 },
    owner: '林悦',
    assistant: '李妍',
    days: 8,
    hotelName: '重庆丽晶酒店',
    hotelPrice: 430,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'processing', text: '出签中' },
      hotel: { state: 'processing', text: '确认中' },
      restaurant: { state: 'pending', text: '待安排' },
      car: { state: 'pending', text: '待安排' },
      scenic: { state: 'processing', text: '确认中' },
      performance: { state: 'pending', text: '待安排' },
      transport: { state: 'pending', text: '待安排' },
    },
  }),
  createTour({
    id: 'mongolia-grassland',
    stage: 'tomorrow_depart',
    name: '蒙古国草原风情7日游',
    country: '蒙古国-MNG',
    countryCode: 'MNG',
    orderNo: `${dayjs().add(1, 'day').format('YYYYMMDD')}MNG`,
    tourNo: 'PTCKG-261016-MN',
    flights: {
      outbound: '来程：乌兰巴托-重庆，OM201，10:00/14:30',
      inbound: '回程：重庆-乌兰巴托，OM202，16:00/18:30',
    },
    source: '蒙古国',
    agency: '蒙古国草原之旅',
    people: { total: 14, adults: 12, children: 2 },
    owner: '周航',
    assistant: '何雨',
    days: 7,
    hotelName: '重庆 JW 万豪酒店',
    hotelPrice: 460,
    operations: {
      subcontract: { state: 'processing', text: '安排中' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'processing', text: '签证中' },
      hotel: { state: 'pending', text: '待安排' },
      restaurant: { state: 'pending', text: '待安排' },
      car: { state: 'pending', text: '待安排' },
      scenic: { state: 'pending', text: '待安排' },
      performance: { state: 'pending', text: '待安排' },
      transport: { state: 'pending', text: '待安排' },
    },
  }),
  createTour({
    id: 'uk-london',
    stage: 'today_return',
    name: '英国伦敦文化9日游',
    country: '英国-UK',
    countryCode: 'UK',
    orderNo: `${dayjs().subtract(8, 'day').format('YYYYMMDD')}UK`,
    tourNo: 'PTCKG-260402-UK',
    flights: {
      outbound: '来程：伦敦-重庆，BA089，20:30/15:20+1',
      inbound: '回程：重庆-伦敦，BA090，11:00/17:20',
    },
    source: '英国',
    agency: '英国英伦假期',
    people: { total: 13, adults: 11, children: 2 },
    owner: '苏晴',
    assistant: '张琪',
    days: 9,
    hotelName: '重庆国贸格兰维大酒店',
    hotelPrice: 290,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'done', text: '已交接' },
      hotel: { state: 'done', text: '8晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'done', text: '已订' },
      transport: { state: 'done', text: '已出票' },
    },
  }),
  createTour({
    id: 'taiwan-round',
    stage: 'tomorrow_return',
    name: '中国台湾环岛8日游',
    country: '中国台湾',
    countryCode: 'TW',
    orderNo: `${dayjs().subtract(6, 'day').format('YYYYMMDD')}TW`,
    tourNo: 'PTCKG-260405-TW',
    flights: {
      outbound: '来程：台北-重庆，CA410，09:10/12:40',
      inbound: '回程：重庆-台北，CA409，14:00/17:00',
    },
    source: '中国台湾',
    agency: '台湾雄狮旅游',
    people: { total: 17, adults: 15, children: 2 },
    owner: '陈远',
    assistant: '李妍',
    days: 8,
    hotelName: '重庆解放碑凯悦酒店',
    hotelPrice: 350,
    operations: {
      subcontract: { state: 'done', text: '已安排' },
      ticket: { state: 'done', text: '已出票' },
      visa: { state: 'done', text: '已交接' },
      hotel: { state: 'done', text: '7晚已安排' },
      restaurant: { state: 'done', text: '已安排' },
      car: { state: 'done', text: '已安排' },
      scenic: { state: 'done', text: '已确认' },
      performance: { state: 'processing', text: '复核中' },
      transport: { state: 'done', text: '已出票' },
    },
  }),
];

export const INITIAL_TOURS = tours;
