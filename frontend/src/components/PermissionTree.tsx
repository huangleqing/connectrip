import { Spin, Tag, Tree } from 'antd';
import type { DataNode } from 'antd/es/tree';
import type { Key } from 'react';
import type { PermissionNode } from '@/types';

interface PermissionTreeProps {
  treeData: PermissionNode[];
  value?: string[];
  onChange?: (permissions: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

function toTreeData(nodes: PermissionNode[]): DataNode[] {
  return nodes.map((node) => {
    if (node.children?.length) {
      return {
        key: node.key,
        selectable: false,
        title: <span className="permission-tree__group">{node.title}</span>,
        children: toTreeData(node.children),
      };
    }

    return {
      key: node.key,
      selectable: false,
      title: (
        <span className="permission-tree__leaf">
          {node.title}
          {node.type === 'button' && (
            <Tag bordered={false} className="permission-tree__tag">
              按钮
            </Tag>
          )}
        </span>
      ),
    };
  });
}

function collectLeafKeys(nodes: PermissionNode[]): Set<string> {
  const keys = new Set<string>();
  const walk = (list: PermissionNode[]) => {
    list.forEach((node) => {
      if (node.children?.length) {
        walk(node.children);
      } else {
        keys.add(node.key);
      }
    });
  };
  walk(nodes);
  return keys;
}

/**
 * 角色权限树。表单值为叶子权限标识，父级分组节点仅用于展示与批量勾选。
 */
export default function PermissionTree({
  treeData,
  value = [],
  onChange,
  disabled,
  loading,
  className,
}: PermissionTreeProps) {
  const leafKeys = collectLeafKeys(treeData);
  const dataNodes = toTreeData(treeData);

  const handleCheck = (checked: Key[] | { checked: Key[]; halfChecked: Key[] }) => {
    const keys = Array.isArray(checked) ? checked : checked.checked;
    onChange?.(keys.filter((key) => leafKeys.has(String(key))).map(String));
  };

  return (
    <div className={`gd-permission-tree ${className ?? ''}`.trim()}>
      <Spin spinning={Boolean(loading)}>
        <Tree
          checkable
          blockNode
          defaultExpandAll
          disabled={disabled}
          selectable={false}
          checkedKeys={value}
          treeData={dataNodes}
          onCheck={handleCheck}
        />
      </Spin>
    </div>
  );
}
