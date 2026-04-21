import { Button, Collapse, Modal, Result, Typography } from "antd";
import type { CollapseProps, ResultProps } from "antd";
import type { ExecuteResult, UndoResult } from "../../types";

interface ResultPanelProps {
  result: ExecuteResult;
  undoResult: UndoResult | null;
  undoing: boolean;
  onBack: () => void;
  onUndo: () => Promise<UndoResult | undefined>;
}

function resultStatus(result: ExecuteResult): ResultProps["status"] {
  if (result.failed > 0) {
    return "error";
  }

  if (result.rolled_back > 0) {
    return "warning";
  }

  return "success";
}

function failureItems(result: ExecuteResult): CollapseProps["items"] {
  if (result.failures.length === 0) {
    return [];
  }

  return [
    {
      key: "failures",
      label: `失败详情（${result.failures.length}）`,
      children: (
        <div className="result-panel__failures">
          {result.failures.map((failure) => (
            <div className="result-panel__failure" key={failure.path}>
              <Typography.Text className="result-panel__path">
                {failure.path}
              </Typography.Text>
              <Typography.Text type="danger">{failure.error}</Typography.Text>
            </div>
          ))}
        </div>
      ),
    },
  ];
}

export function ResultPanel({
  result,
  undoResult,
  undoing,
  onBack,
  onUndo,
}: ResultPanelProps) {
  const handleUndo = () => {
    Modal.confirm({
      cancelText: "取消",
      content: "将尝试还原上次重命名操作，是否继续？",
      okText: "撤销",
      onOk: onUndo,
      title: "撤销上次操作",
    });
  };

  return (
    <section className="result-panel">
      <Result
        extra={[
          <Button key="undo" loading={undoing} onClick={handleUndo}>
            撤销上次操作
          </Button>,
          <Button key="back" onClick={onBack} type="primary">
            返回
          </Button>,
        ]}
        status={resultStatus(result)}
        title="重命名完成"
      />

      <div className="result-panel__stats">
        <Typography.Text className="result-panel__success">
          成功 {result.success} 个
        </Typography.Text>
        <Typography.Text className="result-panel__failed">
          失败 {result.failed} 个
        </Typography.Text>
        <Typography.Text className="result-panel__rolled-back">
          已回滚 {result.rolled_back} 个
        </Typography.Text>
      </div>

      {result.failures.length > 0 ? (
        <Collapse
          className="result-panel__collapse"
          items={failureItems(result)}
        />
      ) : null}

      {undoResult ? (
        <div className="result-panel__undo">
          <Typography.Text>已还原 {undoResult.restored} 个</Typography.Text>
          <Typography.Text
            type={undoResult.failed > 0 ? "danger" : "secondary"}
          >
            失败 {undoResult.failed} 个
          </Typography.Text>
        </div>
      ) : null}
    </section>
  );
}
