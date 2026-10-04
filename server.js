const WebSocket = require('ws');
const screenshot = require('screenshot-desktop');
const robot = require('robotjs');

// Cria o servidor WebSocket na porta 8080
const wss = new WebSocket.Server({ port: 8080 });
console.log("Servidor de acesso remoto a correr na porta 8080...");

wss.on('connection', (ws) => {
    console.log("Cliente web ligado!");

    // 1. Envia capturas de ecrã contínuas para o HTML (Stream de vídeo simplificado)
    const streamInterval = setInterval(async () => {
        try {
            // Captura o ecrã em formato Buffer (JPEG)
            const imgBuffer = await screenshot({ format: 'jpeg' });
            // Converte para Base64 para o HTML conseguir ler
            const base64Img = imgBuffer.toString('base64');
            
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(base64Img);
            }
        } catch (err) {
            console.error("Erro ao capturar ecrã:", err);
        }
    }, 100); // Envia 10 imagens por segundo (10 FPS)

    // 2. Recebe os comandos de clique enviados pelo HTML e executa no PC real
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            
            if (data.action === 'click') {
                // Move o rato real para a posição clicada no HTML e clica
                robot.moveMouse(data.x, data.y);
                robot.mouseClick();
                console.log(`Clique executado em X: ${data.x}, Y: ${data.y}`);
            }
        } catch (err) {
            console.error("Erro ao processar comando do cliente:", err);
        }
    });

    ws.on('close', () => {
        clearInterval(streamInterval);
        console.log("Cliente web desligou-se.");
    });
});
