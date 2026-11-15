import {
  AppstoreOutlined,
  CalendarOutlined,
  CarOutlined,
  CoffeeOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  HomeOutlined,
  NodeIndexOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Alert, Button, Drawer, Popconfirm, Space, Tag, Tabs } from 'antd';
import dayjs from 'dayjs';
import type { UpdateOperationTourParams } from '@/services/operation';
import type { TourGroup } from './data';
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
  canEdit: boolean;
  canDelete: boolean;
  onTabChange: (key: string) => void;
  onClose: () => void;
  onSaveTour: (patch: UpdateOperationTourParams) => Promise<void>;
  onEdit: () => void;
  onDelete: () => void | Promise<void>;
}

export default function TeamDetailDrawer({
  open,
  tour,
  activeTab,
  canViewAmount,
  canExport,
  canEdit,
  canDelete,
  onTabChange,
  onClose,
  onSaveTour,
  onEdit,
  onDelete,
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
              canEdit={canEdit}
              onSaveTour={onSaveTour}
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
              canEdit={canEdit}
              onSaveTour={onSaveTour}
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
              canEdit={canEdit}
              onSaveTour={onSaveTour}
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
              canEdit={canEdit}
              onSaveTour={onSaveTour}
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
            <OtherOpsTab
              tour={tour}
              canEdit={canEdit}
              onSaveTour={onSaveTour}
            />
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
      extra={
        canEdit || canDelete ? (
          <Space size={8}>
            {canEdit ? (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={onEdit}
              >
                编辑团队
              </Button>
            ) : null}
            {canDelete ? (
              <Popconfirm
                title={`确定删除 ${tour?.name ?? ''} 吗？`}
                okText="确定"
                okButtonProps={{ danger: true }}
                cancelText="取消"
                onConfirm={onDelete}
              >
                <Button size="small" danger icon={<DeleteOutlined />}>
                  删除
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        ) : null
      }
    >
      {tour ? (
        <div className="team-drawer">
          {!canEdit ? (
            <Alert
              className="team-drawer__readonly"
              type="info"
              showIcon
              message={
                canDelete
                  ? '当前账号可查看和删除团队，但不能编辑'
                  : '当前账号仅可查看团队操作详情'
              }
              description="编辑及资源安排保存需要「编辑团队」权限，删除需要「删除团队」权限。"
            />
          ) : null}
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
