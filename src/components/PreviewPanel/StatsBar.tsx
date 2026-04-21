import { Badge, Typography } from "antd";

interface StatsBarProps {
  totalCount: number;
  selectedCount: number;
  conflictCount: number;
  warningCount: number;
}

export function StatsBar({
  totalCount,
  selectedCount,
  conflictCount,
  warningCount,
}: StatsBarProps) {
  return (
    <div className="stats-bar">
      <Typography.Text>共 {totalCount} 个文件</Typography.Text>
      <Typography.Text>已选 {selectedCount} 个</Typography.Text>
      <Typography.Text
        className={conflictCount > 0 ? "stats-bar__conflict" : undefined}
      >
        <Badge color={conflictCount > 0 ? "red" : "green"} />
        {conflictCount} 个冲突
      </Typography.Text>
      <Typography.Text
        className={warningCount > 0 ? "stats-bar__warning" : undefined}
      >
        <Badge color={warningCount > 0 ? "orange" : "green"} />
        {warningCount} 个警告
      </Typography.Text>
    </div>
  );
}
