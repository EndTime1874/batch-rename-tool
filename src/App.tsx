import { Empty, Layout } from "antd";

function App() {
  return (
    <Layout className="app-shell">
      <Layout.Sider className="app-sidebar" width={360}>
        <div className="app-sidebar__placeholder">配置面板</div>
      </Layout.Sider>
      <Layout.Content className="app-content">
        <Empty description="请先选择文件夹并配置规则" />
      </Layout.Content>
    </Layout>
  );
}

export default App;
