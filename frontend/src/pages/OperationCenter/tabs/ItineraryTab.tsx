import {
  CalendarOutlined,
  CheckCircleOutlined,
  InfoCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Alert, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { ItineraryDay, TourGroup } from '../data';

interface ItineraryTabProps {
  tour: TourGroup;
}

export default function ItineraryTab({ tour }: ItineraryTabProps) {
  const columns: ColumnsType<ItineraryDay> = [
    {
      title: '天数',
      dataIndex: 'day',
      width: 84,
      align: 'center',
      render: (value: string) => <span className="itinerary-day">{value}</span>,
    },
    {
      title: '日期',
      dataIndex: 'date',
      width: 116,
      render: (value: string) => (
        <span className="itinerary-date">
          <CalendarOutlined /> {value}
        </span>
      ),
    },
    {
      title: '行程安排',
      dataIndex: 'content',
      render: (value: string) => (
        <div className="itinerary-content">{value}</div>
      ),
    },
  ];

  return (
    <div className="operation-tab itinerary-tab">
      <div className="tab-heading">
        <div>
          <h3>
            行程表格
            <Tag color="success" bordered={false}>
              业务确认版
            </Tag>
          </h3>
          <p>
            以业务确认的行程为准，操作安排按天展开；行程变更会同步提醒业务与销售。
          </p>
        </div>
        <div className="tab-heading__meta">
          <span>
            <CheckCircleOutlined /> 共 {tour.itinerary.length} 天
          </span>
          <span>
            <SyncOutlined /> 最后同步 {tour.departureDate}
          </span>
        </div>
      </div>

      <Alert
        className="tab-alert"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        message="操作提示"
        description="行程中的景点、演出与区间交通会在「其他操作」中单独跟进；需要调整酒店、餐厅或用车时，直接在对应页签修改并提交。"
      />

      <Table<ItineraryDay>
        className="operation-detail-table itinerary-table"
        rowKey="day"
        columns={columns}
        dataSource={tour.itinerary}
        pagination={false}
        size="middle"
      />

      <div className="tab-footnote">
        <span>行程来源：业务确认单</span>
        <span>支持从 Excel 行程表导入并按天自动拆分（接口接入后开放）</span>
      </div>
    </div>
  );
}
