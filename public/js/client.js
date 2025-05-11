// Verifica suporte a service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async() => {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            console.log('Service Worker registrado com sucesso:', registration);

            // Verifica se já está inscrito
            checkExistingSubscription(registration);
        } catch (error) {
            console.error('Falha no registro do Service Worker:', error);
            document.getElementById('status').textContent =
                'Seu navegador não suporta notificações push ou há um erro no serviço.';
        }
    });
}

// Elementos da UI
const enableNotifBtn = document.getElementById('enableNotifBtn');
const status = document.getElementById('status');

// Evento do botão
enableNotifBtn.addEventListener('click', () => {
    requestNotificationPermission();
});

// Verifica inscrição existente
async function checkExistingSubscription(registration) {
    const subscription = await registration.pushManager.getSubscription();
    if (subscription) {
        updateUIForSubscribed();
        await sendSubscriptionToServer(subscription);
    }
}

// Solicita permissão para notificações
async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        status.textContent = 'Este navegador não suporta notificações.';
        return;
    }

    try {
        const permission = await Notification.requestPermission();

        if (permission === 'granted') {
            const registration = await navigator.serviceWorker.ready;
            await subscribeUser(registration);
        } else {
            status.textContent = 'Permissão para notificações negada.';
        }
    } catch (error) {
        console.error('Erro ao solicitar permissão:', error);
        status.textContent = 'Erro ao ativar notificações.';
    }
}

// Inscreve o usuário
async function subscribeUser(registration) {
    try {
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            const options = {
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array('BIZplD19isjBbzj1NNu-9khooXQ05ztRebuG-m75utkreF_s2Q36ONsde_eC0cLr-iZ2tRmKFzYSBMlGazkiju0')
            };

            subscription = await registration.pushManager.subscribe(options);
        }

        await sendSubscriptionToServer(subscription);
        updateUIForSubscribed();

        // Armazena localmente
        localStorage.setItem('pushSubscription', JSON.stringify(subscription));

        // Envia notificação de boas-vindas
        await fetch('/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: 'Inscrição ativada!',
                body: 'Você agora receberá nossas notificações.',
                url: window.location.href
            })
        });

    } catch (error) {
        console.error('Erro na inscrição:', error);
        status.textContent = 'Falha ao ativar notificações.';
        throw error;
    }
}

// Envia inscrição para o servidor
async function sendSubscriptionToServer(subscription) {
    try {
        const response = await fetch('/save-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscription)
        });

        if (!response.ok) throw new Error('Erro no servidor');

        const data = await response.json();
        if (!data.success) throw new Error('Falha no servidor');

        console.log('Inscrição enviada ao servidor com sucesso');
    } catch (error) {
        console.error('Erro ao enviar inscrição:', error);
        throw error;
    }
}

// Atualiza a UI quando inscrito
function updateUIForSubscribed() {
    status.textContent = 'Notificações ativadas com sucesso!';
    status.style.color = 'var(--success-color)';
    enableNotifBtn.textContent = '✓ Notificações Ativas';
    enableNotifBtn.disabled = true;
    enableNotifBtn.style.backgroundColor = 'var(--success-color)';
}

// Converte chave pública
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}