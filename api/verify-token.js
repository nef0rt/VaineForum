// Простое хранилище в памяти (на Vercel живет пока сервер не перезапустят)
// В реальном проекте нужно использовать БД
const validTokens = new Map();

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ valid: false });
    }

    // Проверяем формат XXXX-XXXX
    const isValidFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token);
    
    if (isValidFormat) {
        // Добавляем токен в хранилище (для отслеживания)
        validTokens.set(token, { used: false, timestamp: Date.now() });
    }
    
    res.status(200).json({ valid: isValidFormat });
}
