import {
  ArrowRightOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ExportOutlined,
  GlobalOutlined,
  LogoutOutlined,
  ReloadOutlined,
  RiseOutlined,
  SearchOutlined,
  SendOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Access, useAccess, useModel } from '@umijs/max';
import {
  Alert,
  App,
  Button,
  DatePicker,
  Empty,
  Input,
  Select,
  Tag,
  Tooltip,
} from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import {
  OPERATION_LINE_PERMISSION_MAP,
  PERMISSIONS,
} from '@/constants/permissions';
import TeamDetailDrawer from './TeamDetailDrawer';
import {
  COUNTRY_FILTERS,
  INITIAL_TOURS,
  OPERATION_META,
  STAGE_META,
  type OperationKey,
  type OperationSummary,
  type TourGroup,
  type TourStage,
} from './data';
import { downloadExcel } from './utils';
import './index.less';

const { RangePicker } = DatePicker;

const STAGE_OPTIONS = [
  { label: '全部状态', value: 'all' },
  ...Object.entries(STAGE_META).map(([value, meta]) => ({
    label: meta.label,
    value,
  })),
];

const STAGE_STATS: Array<{
  key: TourStage;
  icon: React.ReactNode;
  hint: string;
}> = [
  { key: 'today_depart', icon: <RiseOutlined />, hint: '今天出发的团队' },
  { key: 'tomorrow_depart', icon: <CalendarOutlined />, hint: '明天出发的团队' },
  { key: 'today_return', icon: <LogoutOutlined />, hint: '今天结束行程' },
  { key: 'tomorrow_return', icon: <ClockCircleOutlined />, hint: '明天结束行程' },
];

function OperationBadge({
  summary,
  onClick,
}: {
  summary: OperationSummary;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`operation-progress operation-progress--${summary.state}`}
      title={`${summary.text}（点击查看安排）`}
      onClick={onClick}
    >
      <span className="operation-progress__dot" />
      <span className="operation-progress__text">{summary.text}</span>
    </button>
  );
}

export default function OperationCenterPage() {
  const access = useAccess();
  const { refresh } = useModel('@@initialState');
  const { message } = App.useApp();
  const canExport = access.hasPermission(PERMISSIONS.OPERATION_EXPORT);
  const canViewAmount = access.hasPermission(PERMISSIONS.OPERATION_AMOUNT_VIEW);

  // 角色权限可能已被管理员调整，进入操作中心时重新拉取当前账号权限。
  useEffect(() => {
    void refresh();
    // 仅在进入页面时刷新一次，避免 initialState 更新触发重复请求
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [tours, setTours] = useState<TourGroup[]>(INITIAL_TOURS);
  const [country, setCountry] = useState('全部');
  const [stage, setStage] = useState<'all' | TourStage>('all');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [keyword, setKeyword] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTour, setActiveTour] = useState<TourGroup>();
  const [activeTab, setActiveTab] = useState('itinerary');

  const countryAccess = useMemo(() => {
    return COUNTRY_FILTERS.filter((label) => label !== '全部').reduce<
      Record<string, boolean>
    >((result, label) => {
      const permission = OPERATION_LINE_PERMISSION_MAP[label];
      result[label] = Boolean(permission && access.hasPermission(permission));
      return result;
    }, {});
  }, [access]);

  const accessibleCountryLabels = useMemo(
    () =>
      COUNTRY_FILTERS.filter(
        (label) => label === '全部' || countryAccess[label],
      ),
    [countryAccess],
  );

  const permittedTours = useMemo(
    () => tours.filter((tour) => countryAccess[tour.country]),
    [tours, countryAccess],
  );

  useEffect(() => {
    if (country !== '全部' && !accessibleCountryLabels.includes(country)) {
      setCountry('全部');
    }
  }, [accessibleCountryLabels, country]);

  const baseTours = useMemo(() => {
    const text = keyword.trim().toLowerCase();
    return permittedTours.filter((tour) => {
      if (country !== '全部' && tour.country !== country) {
        return false;
      }
      if (dateRange) {
        const departure = dayjs(tour.departureDate);
        if (
          departure.isBefore(dateRange[0], 'day') ||
          departure.isAfter(dateRange[1], 'day')
        ) {
          return false;
        }
      }
      if (text) {
        const haystack =
          `${tour.name} ${tour.orderNo} ${tour.tourNo} ${tour.agency} ${tour.owner} ${tour.source}`.toLowerCase();
        if (!haystack.includes(text)) {
          return false;
        }
      }
      return true;
    });
  }, [permittedTours, country, dateRange, keyword]);

  const filteredTours = useMemo(() => {
    if (stage === 'all') {
      return baseTours;
    }
    return baseTours.filter((tour) => tour.stage === stage);
  }, [baseTours, stage]);

  const stageCounts = useMemo(() => {
    return Object.keys(STAGE_META).reduce<Record<string, number>>((acc, key) => {
      acc[key] = baseTours.filter((tour) => tour.stage === key).length;
      return acc;
    }, {});
  }, [baseTours]);

  const pendingOperations = useMemo(() => {
    return baseTours.reduce((total, tour) => {
      return (
        total +
        Object.values(tour.operations).filter(
          (operation) =>
            operation.state === 'pending' || operation.state === 'processing',
        ).length
      );
    }, 0);
  }, [baseTours]);

  const countryCounts = useMemo(() => {
    return permittedTours.reduce<Record<string, number>>((acc, tour) => {
      acc[tour.country] = (acc[tour.country] ?? 0) + 1;
      return acc;
    }, {});
  }, [permittedTours]);

  const openDrawer = (tour: TourGroup, tab: string) => {
    setActiveTour(tours.find((item) => item.id === tour.id) ?? tour);
    setActiveTab(tab);
    setDrawerOpen(true);
  };

  const updateOperation = (key: OperationKey, summary: OperationSummary) => {
    if (!activeTour) {
      return;
    }
    setTours((prev) =>
      prev.map((tour) =>
        tour.id === activeTour.id
          ? {
              ...tour,
              operations: {
                ...tour.operations,
                [key]: summary,
              },
            }
          : tour,
      ),
    );
    setActiveTour((prev) =>
      prev
        ? {
            ...prev,
            operations: {
              ...prev.operations,
              [key]: summary,
            },
          }
        : prev,
    );
  };

  const resetFilters = () => {
    setCountry('全部');
    setStage('all');
    setDateRange(null);
    setKeyword('');
  };

  const handleExport = async () => {
    if (!filteredTours.length) {
      message.warning('当前筛选条件下没有可导出的团队');
      return;
    }
    try {
      await downloadExcel(
        `操作中控台_${dayjs().format('YYYYMMDD_HHmm')}.xlsx`,
        '操作中控台',
        [
          '团队状态',
          '订单编号',
          '团号',
          '团队名称',
          '目的地',
          '出团日期',
          '返程日期',
          '航班信息',
          '客源地',
          '组团社',
          '总人数',
          '大人',
          '小孩',
          '业务负责人',
          '助理员',
          ...OPERATION_META.map((item) => item.title),
        ],
        filteredTours.map((tour) => [
          STAGE_META[tour.stage].label,
          tour.orderNo,
          tour.tourNo,
          tour.name,
          tour.country,
          tour.departureDate,
          tour.returnDate,
          `${tour.flights.outbound}；${tour.flights.inbound}`,
          tour.source,
          tour.agency,
          tour.people.total,
          tour.people.adults,
          tour.people.children,
          tour.owner,
          tour.assistant,
          ...OPERATION_META.map((item) => tour.operations[item.key].text),
        ]),
      );
      message.success(`已导出 ${filteredTours.length} 个团队的 Excel 文件`);
    } catch {
      message.error('Excel 导出失败，请稍后重试');
    }
  };

  const columns: ProColumns<TourGroup>[] = [
    {
      title: '团队信息',
      key: 'team',
      fixed: 'left',
      width: 260,
      render: (_, record) => (
        <div className="team-cell">
          <div className="team-cell__head">
            <Tag
              color={STAGE_META[record.stage].color}
              bordered={false}
              className="team-cell__stage"
            >
              {STAGE_META[record.stage].label}
            </Tag>
            <span className="team-cell__country">
              <GlobalOutlined /> {record.country}
            </span>
          </div>
          <button
            type="button"
            className="team-cell__name"
            onClick={() => openDrawer(record, 'itinerary')}
          >
            {record.name}
          </button>
          <div className="team-cell__meta">
            <span>{record.tourNo}</span>
            <span>订单 {record.orderNo}</span>
          </div>
        </div>
      ),
    },
    {
      title: '出团 / 返程',
      key: 'dates',
      width: 108,
      render: (_, record) => (
        <div className="date-cell">
          <span>
            <em>出</em>
            {dayjs(record.departureDate).format('MM-DD')}
          </span>
          <span>
            <em>返</em>
            {dayjs(record.returnDate).format('MM-DD')}
          </span>
        </div>
      ),
    },
    {
      title: '航班信息',
      key: 'flights',
      width: 200,
      render: (_, record) => (
        <div className="flight-cell">
          <Tooltip title={record.flights.outbound}>
            <span>
              <SendOutlined />
              {record.flights.outbound}
            </span>
          </Tooltip>
          <Tooltip title={record.flights.inbound}>
            <span>
              <SendOutlined />
              {record.flights.inbound}
            </span>
          </Tooltip>
        </div>
      ),
    },
    {
      title: '客源地 / 组团社',
      key: 'source',
      width: 120,
      render: (_, record) => (
        <div className="stack-cell">
          <strong>{record.source}</strong>
          <span>{record.agency}</span>
        </div>
      ),
    },
    {
      title: '人数',
      key: 'people',
      width: 92,
      align: 'center',
      render: (_, record) => (
        <div className="people-cell">
          <div>
            <TeamOutlined />
            <strong>{record.people.total}</strong>
            <span>人</span>
          </div>
          <em>
            {record.people.adults} 大 {record.people.children} 小
          </em>
        </div>
      ),
    },
    {
      title: '负责人 / 助理',
      key: 'owner',
      width: 105,
      render: (_, record) => (
        <div className="owner-cell">
          <strong>
            <UserOutlined /> {record.owner}
          </strong>
          <span>助理 · {record.assistant}</span>
        </div>
      ),
    },
    {
      title: '行程详情',
      key: 'itinerary',
      width: 82,
      align: 'center',
      render: (_, record) => (
        <button
          type="button"
          className="text-action"
          onClick={() => openDrawer(record, 'itinerary')}
        >
          {record.itinerary.length} 天 <ArrowRightOutlined />
        </button>
      ),
    },
    ...OPERATION_META.map<ProColumns<TourGroup>>((meta) => ({
      title: meta.title,
      key: meta.key,
      width: meta.key === 'subcontract' || meta.key === 'transport' ? 108 : 94,
      align: 'center',
      render: (_, record) => (
        <OperationBadge
          summary={record.operations[meta.key]}
          onClick={() => openDrawer(record, meta.tab)}
        />
      ),
    })),
    {
      title: '操作',
      key: 'action',
      fixed: 'right',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          size="small"
          className="team-action-button"
          onClick={() => openDrawer(record, 'itinerary')}
        >
          团队操作
        </Button>
      ),
    },
  ];

  return (
    <PageContainer
      title="操作中控台"
      subTitle="出团团队、地接资源与财务进度的统一操作台"
      extra={
        <Access
          accessible={canExport}
          fallback={
            <Tooltip title="当前账号缺少 operation:export 权限">
              <Button icon={<ExportOutlined />} disabled>
                导出 Excel
              </Button>
            </Tooltip>
          }
        >
          <Button type="primary" icon={<ExportOutlined />} onClick={handleExport}>
            导出 Excel
          </Button>
        </Access>
      }
    >
      <div className="operation-console">
        <section className="console-filter-card">
          <div className="console-filter__head">
            <div className="console-filter__title">
              <GlobalOutlined />
              <span>线路筛选</span>
              <em>按目的地快速切换团队视图</em>
            </div>
            <span className="console-filter__tip">
              {access.isSuperAdmin
                ? '超级管理员默认拥有全部线路与金额权限'
                : `已按角色开通 ${accessibleCountryLabels.length - 1} 条线路${
                    canViewAmount ? '' : ' · 金额已隐藏'
                  }`}
            </span>
          </div>
          <div className="country-pills">
            {accessibleCountryLabels.map((item) => {
              const count = item === '全部' ? permittedTours.length : countryCounts[item];
              return (
                <button
                  key={item}
                  type="button"
                  className={`country-pill${country === item ? ' is-active' : ''}${
                    item !== '全部' && !count ? ' is-empty' : ''
                  }`}
                  onClick={() => setCountry(item)}
                >
                  <span>{item}</span>
                  {item !== '全部' && count ? <em>{count}</em> : null}
                </button>
              );
            })}
          </div>
          {accessibleCountryLabels.length <= 1 ? (
            <Alert
              className="console-line-alert"
              type="warning"
              showIcon
              message="当前账号未分配线路权限"
              description="请联系管理员在「系统管理 → 角色管理 → 线路 / 国家权限」中勾选需要查看的线路。"
            />
          ) : null}
          <div className="console-filter__divider" />
          <div className="console-filter__form">
            <div className="filter-field">
              <span>出团日期</span>
              <RangePicker
                value={dateRange}
                format="YYYY-MM-DD"
                placeholder={['开始日期', '结束日期']}
                onChange={(_, strings) => {
                  if (strings[0] && strings[1]) {
                    setDateRange([dayjs(strings[0]), dayjs(strings[1])]);
                  } else {
                    setDateRange(null);
                  }
                }}
              />
            </div>
            <div className="filter-field">
              <span>团队状态</span>
              <Select
                value={stage}
                options={STAGE_OPTIONS}
                style={{ width: 150 }}
                onChange={(value) => setStage(value as 'all' | TourStage)}
              />
            </div>
            <div className="filter-field filter-field--search">
              <span>快速搜索</span>
              <Input
                value={keyword}
                allowClear
                prefix={<SearchOutlined />}
                placeholder="团号 / 订单编号 / 团队名称"
                style={{ width: 258 }}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </div>
            <Button icon={<ReloadOutlined />} onClick={resetFilters}>
              重置
            </Button>
            <span className="console-filter__result">
              共 <strong>{filteredTours.length}</strong> 个团队
              {pendingOperations > 0 ? (
                <em> · 待跟进操作 {pendingOperations} 项</em>
              ) : null}
            </span>
          </div>
        </section>

        <div className="console-stats">
          {STAGE_STATS.map((item) => {
            const meta = STAGE_META[item.key];
            const active = stage === item.key;
            return (
              <button
                key={item.key}
                type="button"
                className={`console-stat console-stat--${item.key}${active ? ' is-active' : ''}`}
                onClick={() => setStage(active ? 'all' : item.key)}
              >
                <span className="console-stat__icon">{item.icon}</span>
                <span className="console-stat__body">
                  <span className="console-stat__label">{meta.label}</span>
                  <span className="console-stat__hint">{item.hint}</span>
                </span>
                <span className="console-stat__count">
                  {stageCounts[item.key] ?? 0}
                  <em>个</em>
                </span>
              </button>
            );
          })}
        </div>

        <ProTable<TourGroup>
          className="console-team-table"
          rowKey="id"
          columns={columns}
          dataSource={filteredTours}
          search={false}
          options={false}
          cardBordered={false}
          tableLayout="fixed"
          scroll={{ x: 1980 }}
          pagination={{
            pageSize: 8,
            showSizeChanger: false,
            showTotal: (total) => `共 ${total} 个团队`,
          }}
          headerTitle={
            <div className="console-table-title">
              <span>团队操作列表</span>
              <em>点击操作进度进入对应安排页 · 左右滚动查看全部进度</em>
            </div>
          }
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="没有符合筛选条件的团队"
              >
                <Button onClick={resetFilters}>清空筛选条件</Button>
              </Empty>
            ),
          }}
        />
      </div>

      <TeamDetailDrawer
        open={drawerOpen}
        tour={activeTour}
        activeTab={activeTab}
        canViewAmount={canViewAmount}
        canExport={canExport}
        onTabChange={setActiveTab}
        onClose={() => setDrawerOpen(false)}
        onUpdateOperation={updateOperation}
      />
    </PageContainer>
  );
}
