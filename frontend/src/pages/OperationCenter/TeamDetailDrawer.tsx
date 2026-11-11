import {
  AppstoreOutlined,
  CalendarOutlined,
  CarOutlined,
  CoffeeOutlined,
  FileTextOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Drawer, Tag, Tabs } from 'antd';
import dayjs from 'dayjs';
import type { OperationKey, OperationSummary, TourGroup } from './data';
import { STAGE_META } from './data';
import FleetTab from './tabs/FleetTab';
import HotelTab from './tabs/HotelTab';
import ItineraryTab from './tabs/ItineraryTab';
import OtherOpsTab from './tabs/OtherOpsTab';
import RestaurantTab from './tabs/RestaurantTab';
import SubcontractTab from './tabs/SubcontractTab';

interface TeamDetailDrawerProps {
  open: boolean;
  tour?: TourGroup;
  activeTab: string;
  canViewAmount: boolean;
  canExport: boolean;
  onTabChange: (key: string) => void;
  onClose: () => void;
  onUpdateOperation: (key: OperationKey, summary: OperationSummary) => void;
}

export default function TeamDetailDrawer({
  open,
  tour,
  activeTab,
  canViewAmount,
  canExport,
  onTabChange,
  onClose,
  onUpdateOperation,
}: TeamDetailDrawerProps) {
  const items = tour
    ? [
        {
          key: 'itinerary',
          label: (
            <span className="team-tab-label">
              <FileTextOutlined /> 行程表格
            </span>
          ),
          children: <ItineraryTab tour={tour} />,
        },
        {
          key: 'subcontract',
          label: (
            <span className="team-tab-label">
              <NodeIndexOutlined /> 转包地接
            </span>
          ),
          children: (
            <SubcontractTab
              tour={tour}
              canViewAmount={canViewAmount}
              onDone={(summary) => onUpdateOperation('subcontract', summary)}
            />
          ),
        },
        {
          key: 'hotel',
          label: (
            <span className="team-tab-label">
              <HomeOutlined /> 酒店安排
              <em>{tour.hotels.length}</em>
            </span>
          ),
          children: (
            <HotelTab
              tour={tour}
              canViewAmount={canViewAmount}
              canExport={canExport}
              onDone={(summary) => onUpdateOperation('hotel', summary)}
            />
          ),
        },
        {
          key: 'restaurant',
          label: (
            <span className="team-tab-label">
              <CoffeeOutlined /> 餐厅安排
              <em>{tour.restaurants.length}</em>
            </span>
          ),
          children: (
            <RestaurantTab
              tour={tour}
              canViewAmount={canViewAmount}
              canExport={canExport}
              onDone={(summary) => onUpdateOperation('restaurant', summary)}
            />
          ),
        },
        {
          key: 'fleet',
          label: (
            <span className="team-tab-label">
              <CarOutlined /> 车队安排
            </span>
          ),
          children: (
            <FleetTab
              tour={tour}
              canViewAmount={canViewAmount}
              canExport={canExport}
              onDone={(summary) => onUpdateOperation('car', summary)}
            />
          ),
        },
        {
          key: 'other',
          label: (
            <span className="team-tab-label">
              <AppstoreOutlined /> 其他操作
            </span>
          ),
          children: (
            <OtherOpsTab tour={tour} onUpdate={onUpdateOperation} />
          ),
        },
      ]
    : [];

  return (
    <Drawer
      open={open && Boolean(tour)}
      width="min(1180px, 96vw)"
      className="team-detail-drawer"
      title="团队操作详情"
      onClose={onClose}
    >
      {tour ? (
        <div className="team-drawer">
          <section className="team-drawer__hero">
            <div className="team-drawer__identity">
              <div className="team-drawer__eyebrow">
                <Tag
                  color={STAGE_META[tour.stage].color}
                  bordered={false}
                  className="team-cell__stage"
                >
                  {STAGE_META[tour.stage].label}
                </Tag>
                <span>{tour.country}</span>
                <span>{tour.tourNo}</span>
              </div>
              <h2>{tour.name}</h2>
              <div className="team-drawer__sub">
                <span>订单编号 {tour.orderNo}</span>
                <span>
                  <CalendarOutlined /> 出团 {tour.departureDate} · 返程 {tour.returnDate}
                </span>
              </div>
            </div>
            <div className="team-drawer__metrics">
              <div>
                <span>团队人数</span>
                <strong>
                  <TeamOutlined /> {tour.people.total}
                  <em>人</em>
                </strong>
                <small>
                  {tour.people.adults} 大 {tour.people.children} 小
                </small>
              </div>
              <div>
                <span>业务负责人</span>
                <strong>
                  <UserOutlined /> {tour.owner}
                </strong>
                <small>助理 · {tour.assistant}</small>
              </div>
              <div>
                <span>客源 / 组团社</span>
                <strong>{tour.source}</strong>
                <small>{tour.agency}</small>
              </div>
            </div>
          </section>

          <div className="team-drawer__flight">
            <SendOutlined />
            <div>
              <span>{tour.flights.outbound}</span>
              <span>{tour.flights.inbound}</span>
            </div>
            <em>
              行程共 {tour.itinerary.length} 天 · 最晚更新{' '}
              {dayjs(tour.departureDate).subtract(1, 'day').format('MM-DD HH:mm')}
            </em>
          </div>

          <Tabs
            className="team-drawer__tabs"
            activeKey={activeTab}
            items={items}
            onChange={onTabChange}
          />
        </div>
      ) : null}
    </Drawer>
  );
}
