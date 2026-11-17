const fs = require('fs');

async function processSubscription() {
    const subUrl = process.env.RAW_SUB_URL;
    if (!subUrl) {
        console.error("Error: RAW_SUB_URL is not set.");
        process.exit(1);
    }

    try {
        console.log("Fetching subscription...");
        const response = await fetch(subUrl);
        const text = await response.text();

        // 兼容处理：检查并尝试 Base64 解码
        let decodedContent = text;
        try {
            const buff = Buffer.from(text.trim(), 'base64');
            const unencoded = buff.toString('utf8');
            if (unencoded.includes('vmess://') || unencoded.includes('vless://') || unencoded.includes('trojan://') || unencoded.includes('proxies:')) {
                decodedContent = unencoded;
            }
        } catch (e) {
            // 解码失败则按原样文本处理
        }

        // 核心正则表达式清洗规则
        let cleaned = decodedContent
            // 1. 移除到期时间（如 2026-12-31 或 2026.12.31）
            .replace(/\b\d{4}[-/年]\d{1,2}[-/月]\d{1,2}(?:日)?\b/g, '')
            // 2. 移除剩余流量/套餐信息
            .replace(/剩余[\s\S]*?(?:G|GB|MB|KB|T|TB)/gi, '')
            .replace(/(?:流量|traffic|expire|到期)[\s\S]*?(\||$)/gi, '')
            // 3. 移除中括号或全角括号包裹的机场名称前缀
            .replace(/\[.*?\]|【.*?】/g, '')
            // 4. 移除测速倍率后缀（如 1x, 0.5x, 2倍）
            .replace(/\b\d+(\.\d+)?([xX]|倍)\b/g, '')
            // 5. 整理多余的管道符与空格
            .replace(/\|\s*\|\s*/g, '|');

        // 将清洗后的内容写入 clean_sub.txt 文件
        fs.writeFileSync('clean_sub.txt', cleaned, 'utf8');
        console.log("Subscription cleaned successfully!");

    } catch (error) {
        console.error("Failed to process subscription:", error);
        process.exit(1);
    }
}

processSubscription();
