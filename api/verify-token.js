// Список валидных токенов (в реальном проекте нужно хранить в БД)
const validTokens = new Set();

// Заглушка для демо - в реальности должно быть подключение к БД
validTokens.add('ABCD-1234');
validTokens.add('TEST-5678');
validTokens.add('DEMO-9999');

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ valid: false, error: 'Token required' });
    }

    // В реальном проекте здесь проверка в базе данных
    // Сейчас просто проверяем формат
    const isValidFormat = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token);
    
    // Имитация проверки (для демо)
    const isValid = isValidFormat && token.length === 9;
    
    res.status(200).json({ 
        valid: isValid,
        message: isValid ? 'Токен действителен' : 'Неверный токен'
    });
}
