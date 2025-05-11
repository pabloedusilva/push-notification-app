const express = require('express');
const webpush = require('web-push');
const path = require('path');

const app = express();

// Configurações
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

// Substitua com suas chaves VAPID reais em produção
const publicVapidKey = 'BIZplD19isjBbzj1NNu-9khooXQ05ztRebuG-m75utkreF_s2Q36ONsde_eC0cLr-iZ2tRmKFzYSBMlGazkiju0';
const privateVapidKey = 'ZmqXZ0MyyZcp3AD68GwhSlpxTa8ZcdqlXuuVerq5oTk';

webpush.setVapidDetails(
    'mailto:contato@seusite.com',
    publicVapidKey,
    privateVapidKey
);

// Armazenamento simples (em produção, use um banco de dados)
let subscriptions = [];

// Rota para salvar inscrição
app.post('/save-subscription', (req, res) => {
    const subscription = req.body;
    subscriptions.push(subscription);
    console.log('Inscrição salva:', subscription);
    res.status(200).json({ success: true });
});

// Rota para enviar notificação
app.post('/send-notification', (req, res) => {
    const { title, body, url, image } = req.body;

    if (subscriptions.length === 0) {
        return res.status(400).json({ success: false, message: 'Nenhum dispositivo inscrito' });
    }

    // Payload mais bonito e interessante
    const payload = JSON.stringify({
        title: title || '🎉 Novidade para você!',
        body: body || 'Clique e descubra algo incrível!',
        icon: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // Ícone colorido
        badge: 'https://cdn-icons-png.flaticon.com/512/190/190411.png', // Badge menor
        image: image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80', // Imagem grande
        vibrate: [300, 100, 400, 100, 300],
        data: {
            url: url || 'https://seusite.com',
            timestamp: Date.now()
        },
        actions: [
            { action: 'open', title: '🔗 Abrir', icon: 'https://cdn-icons-png.flaticon.com/512/545/545682.png' },
            { action: 'close', title: '❌ Fechar', icon: 'https://cdn-icons-png.flaticon.com/512/1828/1828778.png' }
        ]
    });

    const sendPromises = subscriptions.map((sub, idx) =>
        webpush.sendNotification(sub, payload).catch(err => {
            console.error('Erro ao enviar:', err);
            if (err.statusCode === 410 || err.statusCode === 404) {
                subscriptions.splice(idx, 1);
            }
        })
    );

    Promise.all(sendPromises)
        .then(() => res.status(200).json({ success: true }))
        .catch(err => {
            console.error('Erro geral:', err);
            res.status(500).json({ success: false });
        });
});

// Rotas para as páginas
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
    console.log(`Dashboard: http://localhost:${PORT}/dashboard`);
});