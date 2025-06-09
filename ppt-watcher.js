const fs = require('fs');
const path = require('path');

// 监控目录与HTML卡片对应关系
const WATCH_DIRS = {
    'AI': 'AI工程',
    'Web3': 'Web3工程', 
    'FrontEnd': '前端工程',
    'InvestMent': '知行合一周报'
};

// 需要监控的PPT子目录
const PPT_DIR = path.join(__dirname, 'PPT');
const INDEX_FILE = path.join(__dirname, 'blogIndex', 'index.html');

// 监控所有指定目录
Object.keys(WATCH_DIRS).forEach(dir => {
    const fullPath = path.join(PPT_DIR, dir);
    
    const watcher = fs.watch(fullPath, (eventType, filename) => {
        console.log(`文件系统事件: ${eventType} ${filename}`);
        if (filename && (eventType === 'rename' || eventType === 'change')) {
            console.log(`检测到${dir}目录变化: ${filename}`);
            try {
                updateIndexHtml(dir);
            } catch (err) {
                console.error(`更新失败: ${err.message}`);
            }
        }
    });

    watcher.on('error', (err) => {
        console.error(`监控错误: ${err.message}`);
    });
    
    console.log(`开始监控目录: ${fullPath}`);
});

// 更新index.html中的对应卡片
function updateIndexHtml(dir) {
    const categoryName = WATCH_DIRS[dir];
    const dirPath = path.join(PPT_DIR, dir);
    
    console.log(`正在扫描目录: ${dirPath}`);
    if (!fs.existsSync(dirPath)) {
        console.error(`目录不存在: ${dirPath}`);
        return;
    }

    const files = fs.readdirSync(dirPath);
    console.log(`找到文件: ${files.join(', ')}`);
    
    // 生成新的列表项HTML
    const newListItems = files.map(file => {
        const filePath = path.join('..', 'PPT', dir, file).replace(/\\/g, '/');
        const displayName = path.basename(file, path.extname(file));
        return `<li><a href="${filePath}" target="_blank" rel="noopener noreferrer">${displayName}</a></li>`;
    }).join('\n');
    
    // 读取index.html内容
    let html = fs.readFileSync(INDEX_FILE, 'utf8');
    
    // 构建更精确的正则表达式匹配
    const regex = new RegExp(
        `(<h2 class="category-toggle">${categoryName}</h2>\\s*<div class="category-content">\\s*<ul>\\s*)([\\s\\S]*?)(\\s*</ul>\\s*</div>)`
    );
    console.log('使用正则表达式:', regex);
    console.log('HTML内容长度:', html.length);
    
    // 输出关键HTML片段用于调试
    const sampleHtml = html.includes(categoryName) 
        ? html.substring(html.indexOf(categoryName)-50, html.indexOf(categoryName)+200)
        : '未找到匹配的分类名称';
    console.log('HTML片段:', sampleHtml);
    
    // 测试正则表达式
    const match = html.match(regex);
    if (!match) {
        console.error('正则表达式匹配失败');
        console.error('尝试匹配的内容:', html.substring(0, 200) + '...');
        console.error('请检查HTML结构是否匹配:', regex);
        return;
    }
    console.log('匹配成功，找到卡片区域:', match[0]);
    
    // 替换内容
    const newHtml = html.replace(regex, `$1\n${newListItems}\n$3`);
    if (newHtml === html) {
        console.error(`未能找到${categoryName}卡片区域，请检查HTML结构`);
        return;
    }
    html = newHtml;
    console.log(html)
    // 写回文件
    fs.writeFileSync(INDEX_FILE, html, 'utf8');
    console.log(`已更新${categoryName}卡片内容`);
}

// 初始扫描并更新所有目录
Object.keys(WATCH_DIRS).forEach(dir => {
    console.log(`执行初始扫描: ${dir}`);
    updateIndexHtml(dir);
});

console.log('PPT目录监控服务已启动');
console.log('可以手动创建测试文件验证功能');
