document.addEventListener('DOMContentLoaded', () => {
    const notificationForm = document.getElementById('notificationForm');
    const result = document.getElementById('result');
    const refreshBtn = document.getElementById('refreshBtn');
    const subscribersCount = document.getElementById('subscribersCount');

    // Carrega contagem inicial
    updateSubscribersCount();

    // Envia notificação
    notificationForm.addEventListener('submit', async(e) => {
        e.preventDefault();

        const title = document.getElementById('title').value;
        const body = document.getElementById('body').value;
        const url = document.getElementById('url').value;
        const image = document.getElementById('image').value;

        try {
            const response = await fetch('/send-notification', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, body, url, image })
            });

            const data = await response.json();

            if (data.success) {
                showResult('Notificação enviada com sucesso!', 'success');
                notificationForm.reset();
            } else {
                showResult(data.message || 'Falha ao enviar notificação', 'error');
            }
        } catch (error) {
            console.error('Erro:', error);
            showResult('Erro ao conectar com o servidor', 'error');
        }
    });

    // Atualiza contagem
    refreshBtn.addEventListener('click', updateSubscribersCount);

    // Mostra resultado
    function showResult(message, type) {
        result.textContent = message;
        result.className = `result ${type}`;

        setTimeout(() => {
            result.textContent = '';
            result.className = 'result';
        }, 5000);
    }

    // Atualiza contagem de inscritos
    async function updateSubscribersCount() {
        try {
            // Em produção, você teria uma rota API para isso
            // Aqui estamos apenas simulando
            const response = await fetch('/save-subscription'); // Rota fictícia
            const count = Math.floor(Math.random() * 100) + 1; // Simulação
            subscribersCount.textContent = count;
        } catch (error) {
            console.error('Erro ao atualizar contagem:', error);
            subscribersCount.textContent = 'Erro';
        }
    }
});