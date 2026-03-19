import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'tokens.json');

// Убедимся что папка существует
if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
}

// Загружаем токены
function loadTokens() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error('Error loading tokens:', e);
    }
    return {};
}

// Сохраняем токены
function saveTokens(tokens) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(tokens, null, 2));
    } catch (e) {
        console.error('Error saving tokens:', e);
    }
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token, chat_id } = req.body;
    
    if (!token || !chat_id) {
        return res.status(400).json({ error: 'Missing data' });
    }

    const tokens = loadTokens();
    tokens[token] = chat_id;
    saveTokens(tokens);

    console.log(`✅ Token ${token} registered for chat ${chat_id}`);

    res.status(200).json({ success: true });
}
