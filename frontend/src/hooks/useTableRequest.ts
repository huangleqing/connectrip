import type { ProTableProps } from '@ant-design/pro-components';
import { useRequest } from 'ahooks';
import { useCallback } from 'react';
import type { PageQuery, PageResult } from '@/types';

type TableParams = Record<string, any>;

/**
 * 将 ahooks 的 useRequest 适配为 ProTable 的 request。
 * 分页、搜索和表格重载仍由 ProTable 管理，接口调用统一走 useRequest。
 */
export function useTableRequest<T extends Record<string, any>, P extends TableParams = TableParams>(
  service: (params: P & PageQuery) => Promise<PageResult<T>>,
) {
  const { runAsync } = useRequest(service, { manual: true });

  const request = useCallback<NonNullable<ProTableProps<T, P>['request']>>(
    async (params) => {
      const { current = 1, pageSize = 10, ...rest } = params as P & {
        current?: number;
        pageSize?: number;
      };

      try {
        const result = await runAsync({
          ...(rest as P),
          page: current,
          pageSize,
        });
        return {
          data: result.list,
          total: result.total,
          success: true,
        };
      } catch {
        return {
          data: [],
          total: 0,
          success: false,
        };
      }
    },
    [runAsync],
  );

  return request;
}
