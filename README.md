部署到 Cloudflare Pages 的详细步骤

这个系统可以完全通过 Cloudflare 仪表盘部署，以下是具体步骤：

1. 准备代码仓库
   · 在你的 GitHub 或 GitLab 账户中创建一个新的代码仓库。
   · 将上面提供的三个文件（index.html, style.css, script.js）上传或提交到这个仓库中。
2. 在 Cloudflare Pages 中创建项目
   · 登录 Cloudflare 仪表盘，在账户主页侧边栏找到 Workers & Pages 服务。
   · 点击 Create application，然后选择 Pages 标签页。
   · 点击 Connect to Git 按钮，连接你的代码仓库并授权。
3. 配置构建设置
   · 在设置页面中，你需要配置以下选项：
     · Framework preset（框架预设）: 选择 None 或 Static。
     · Build command（构建命令）: 清空此栏，因为这是一个静态站点，无需构建。
     · Build output directory（构建输出目录）: 设置为 /。Cloudflare Pages 会自动托管根目录下的文件。
4. 开始部署
   · 点击 Save and Deploy 按钮。
   · 部署完成后，Cloudflare 会为你提供一个 .pages.dev 的临时域名，你可以通过这个链接访问你的系统。

配置密码保护（通过 Cloudflare 仪表盘）

为了保护你的页面，无需修改代码，可以直接在 Cloudflare 仪表盘中设置：

1. 在 Cloudflare 仪表盘中，选择你刚部署的 Pages 项目。
2. 进入 Settings 标签页。
3. 找到 Access 或 Authentication 配置部分（具体名称可能因界面更新而异）。
4. 开启 Password Protection 或类似的选项，并设置一个用户名和密码。这样，所有访问者都需要输入密码才能查看页面。

使用说明

· 参数设置：在“系统参数设置”区域，你可以根据实际情况调整各项参数。
· 记录加班：在“加班记录”区域选择类型、时长和日期后，点击“添加记录”。
· 查看统计：系统会自动计算并显示在“统计摘要”区域，包括税后实发金额。
· 导出数据：点击“导出数据”可将所有记录和设置下载为JSON文件备份。
· 导入数据：点击“导入数据”可选择之前导出的JSON文件恢复记录。