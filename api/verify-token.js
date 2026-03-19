export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { token } = req.body;
    
    if (!token) {
        return res.status(400).json({ valid: false });
    }

    const isValid = /^[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(token);
    
    res.status(200).json({ valid: isValid });
}
