const sheetUrl = 'https://api.sheety.co/7a6b39da1af36e7ace5d2c61d043fcdf/chatMotoristas/motoristas';

document.addEventListener("DOMContentLoaded", function () {
    if (window.chatInitialized) return;
    window.chatInitialized = true;

    let cpf = localStorage.getItem("ultimoCPF") || "";
    let chatBox = document.getElementById("chat-box");
    let userInput = document.getElementById("user-input");
    let fileInput = document.getElementById("file-input");
    let attachButton = document.getElementById("attach-button");
    let sendButton = document.getElementById("send-button");
    let currentContext = "";
    let lastOptionSelected = "";
    let usersData = {};

    // Carrega dados da planilha Sheety
    function carregarMotoristas() {
        fetch('https://api.sheety.co/7a6b39da1af36e7ace5d2c61d043fcdf/chatMotoristas/motoristas')
            .then(response => response.json())
            .then(data => {
                data.motoristas.forEach(entry => {
                    usersData[entry.cpf] = {
                        nome: entry.nome,
                        tipoCarga: entry.tipoCarga,
                        embarqueLocal: entry.embarqueLocal,
                        embarqueResponsavel: entry.embarqueResponsavel,
                        desembarqueLocal: entry.desembarqueLocal,
                        desembarqueResponsavel: entry.desembarqueResponsavel,
                        paradasProgramadas: entry.paradasProgramadas
                    };
                });

                if (cpf && usersData[cpf]) {
                    restoreMessagesFromLocalStorage(cpf);
                    displayMainMenu();
                }
            })
            .catch(error => {
                console.error("Erro ao buscar motoristas:", error);
            });
    }

    if (navigator.onLine) carregarMotoristas();
    window.addEventListener('online', carregarMotoristas);

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                window.addEventListener('online', () => {
                    registration.update();
                });

                setInterval(() => {
                    if (navigator.onLine) {
                        registration.update();
                    }
                }, 3600000);

                navigator.serviceWorker.addEventListener('message', event => {
                    if (event.data.type === 'SW_UPDATED') {
                        window.location.reload();
                    }
                });

                registration.update();
            });
    }

    function verificarStatus() {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');

        if (navigator.onLine) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
            statusText.textContent = 'Você está online';
        } else {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
            statusText.textContent = 'Você está offline';
        }
    }

    setTimeout(verificarStatus, 1000);
    window.addEventListener('online', verificarStatus);
    window.addEventListener('offline', verificarStatus);

    function sendMessage() {
        const message = userInput.value.trim();
        if (message === "") return;

        displayMessage(message, "user-message");
        userInput.value = "";
        processUserMessage(message);
    }

    function processUserMessage(message) {
        if (!cpf) {
            handleCPFInput(message);
        } else if (!currentContext) {
            handleMainMenu(message);
        } else {
            handleContextResponses(message);
        }
    }

    if (sendButton) {
        sendButton.addEventListener("click", function (e) {
            e.preventDefault();
            sendMessage();
        });
    }

    if (userInput) {
        userInput.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                sendMessage();
            }
        });
    }

    function displayMessage(content, className) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", className);
        messageDiv.innerHTML = content.replace(/\n/g, "<br>");
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        if (cpf) {
            saveMessageToLocalStorage(cpf, content, className);
        }
    }

    function saveMessageToLocalStorage(cpf, content, className) {
        let history = JSON.parse(localStorage.getItem("chat_" + cpf)) || [];
        history.push({ content, className });
        localStorage.setItem("chat_" + cpf, JSON.stringify(history));
    }

    function restoreMessagesFromLocalStorage(cpf) {
        const history = JSON.parse(localStorage.getItem("chat_" + cpf)) || [];
        history.forEach(entry => {
            displayMessage(entry.content, entry.className);
        });
    }

    function handleCPFInput(message) {
        cpf = message.replace(/\D/g, "");
        localStorage.setItem("ultimoCPF", cpf);

        if (usersData[cpf]) {
            restoreMessagesFromLocalStorage(cpf);
            displayMainMenu();
        } else {
            displayMessage("CPF não encontrado.", "bot-message");
            cpf = "";
        }
    }

    function atualizarDadosDoMotorista() {
        const ultimoCPF = localStorage.getItem("ultimoCPF");
        if (!ultimoCPF || !navigator.onLine) return;
    
        fetch('https://api.sheety.co/7a6b39da1af36e7ace5d2c61d043fcdf/chatMotoristas/motoristas')
            .then(response => response.json())
            .then(data => {
                const atualizado = data.motoristas.find(m => m.cpf === ultimoCPF);
                if (atualizado) {
                    usersData[ultimoCPF] = {
                        nome: atualizado.nome,
                        tipoCarga: atualizado.tipoCarga,
                        embarqueLocal: atualizado.embarqueLocal,
                        embarqueResponsavel: atualizado.embarqueResponsavel,
                        desembarqueLocal: atualizado.desembarqueLocal,
                        desembarqueResponsavel: atualizado.desembarqueResponsavel,
                        paradasProgramadas: atualizado.paradasProgramadas
                    };
                    console.log("✅ Dados atualizados para CPF " + ultimoCPF);
                }
            })
            .catch(error => {
                console.error("Erro ao atualizar dados do motorista:", error);
            });
    }
    
    function enviar_planilha(cpf, message){
        // Enviar para aba 'mensagens' na planilha
        console.log(cpf);
        if (navigator.onLine) {
            const user = usersData[cpf];
            const payload = {
                mensagem: {
                    nome: user.nome,
                    conteudo: message,
                    tipo: "motorista",
                    timestamp: new Date().toLocaleString("pt-BR")
                }
            }
            fetch('https://api.sheety.co/7a6b39da1af36e7ace5d2c61d043fcdf/chatMotoristas/mensagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
            })
            .then(res => res.json())
            .then(data => {
                console.log("✅ Mensagem enviada para planilha:", data);
            })
            .catch(async (err) => {
                const errorBody = await err.json?.();
                console.error("❌ Erro ao enviar mensagem para a planilha:", errorBody || err);
              });
              
              
        } else {
            // Guarda na fila offline
            let fila = JSON.parse(localStorage.getItem("filaMensagensOffline") || "[]");
            fila.push({
                nome: user.nome,
                conteudo: message,
                tipo: "motorista",
                timestamp: new Date().toISOString()
            });
            localStorage.setItem("filaMensagensOffline", JSON.stringify(fila));
        }
    }

    attachButton.addEventListener("click", () => {
        fileInput.click();
    });
    
    fileInput.addEventListener("change", () => {
        const file = fileInput.files[0];
        if (file && file.type.startsWith("image/")) {
            displayMessage("📤 Enviando imagem...", "user-message");
    
            uploadImageToImgur(file, (err, url) => {
                if (err) {
                    displayMessage("❌ Erro ao enviar imagem.", "bot-message");
                    return;
                }
    
                displayMessage(`<a href="${url}" target="_blank">📸 Ver imagem enviada</a>`, "user-message");
                saveMessageToLocalStorage(cpf, `<a href="${url}" target="_blank">📸 Ver imagem enviada</a>`, "user-message");
    
                // Envia o link da imagem para a planilha
                enviar_planilha(cpf, `Imagem enviada: ${url}`);
            });
        }
    });


    function uploadImageToImgur(file, callback) {
        const clientId = "921ef7070dda201";
        const formData = new FormData();
        formData.append("image", file);
    
        fetch("https://api.imgur.com/3/image", {
            method: "POST",
            headers: {
                Authorization: `Client-ID ${clientId}`,
            },
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const imageUrl = data.data.link;
                callback(null, imageUrl);
            } else {
                callback("Erro ao enviar imagem");
            }
        })
        .catch(err => callback(err));
    }

    function displayMainMenu() {
        const user = usersData[cpf];
        displayMessage(
            `Olá, ${user.nome}! Escolha uma opção:\n1️⃣ Embarque\n2️⃣ Rota\n3️⃣ Desembarque\n4️⃣ Pós-viagem\n5️⃣ Contatos úteis\n6️⃣ Trocar motorista`,
            "bot-message"
        );
    }

    function handleMainMenu(message) {
        if (message === "0") {
            lastOptionSelected = "";
            displayMainMenu();
            return;
        }

        switch (message) {
            case "1":
                currentContext = "embarque";
                lastOptionSelected = "";
                displayMenu("embarque");
                break;
            case "2":
                currentContext = "rota";
                lastOptionSelected = "";
                displayMenu("rota");
                break;
            case "3":
                currentContext = "desembarque";
                lastOptionSelected = "";
                displayMenu("desembarque");
                break;
            case "4":
                displayMessage("Para pós-viagem, contate Otávio: (34) 99894-2493", "bot-message");
                break;
            case "5":
                currentContext = "contato";
                lastOptionSelected = "";
                displayMenu("contato");
                break;
            case "6":
                localStorage.removeItem("ultimoCPF");
                cpf = "";
                chatBox.innerHTML = "";
                displayMessage("Olá! Sou o assistente virtual da Oliveira Transportes. Digite seu CPF, somente em números.", "bot-message");
                break;
            default:
                displayMessage("Opção inválida. Escolha de 1 a 6.", "bot-message");
        }
    }

    function handleContextResponses(message) {
        const user = usersData[cpf];
        const isNumber = !isNaN(Number(message));

        if (message === "0") {
            currentContext = "";
            lastOptionSelected = "";
            displayMainMenu();
            return;
        }

        if (currentContext === "embarque" && lastOptionSelected === "4" && isNumber) {
            displayMessage("✅ KM inicial registrado: " + message, "bot-message");
            message1 = "KM inicial: " + message;
            enviar_planilha(cpf, message1);
            lastOptionSelected = "";
            setTimeout(displayMenuAfterAction, 1500);
            return;
        }

        if (currentContext === "desembarque" && lastOptionSelected === "3" && isNumber) {
            displayMessage("✅ KM final registrado: " + message, "bot-message");
            message2 = "KM final: " + message;
            enviar_planilha(cpf, message2);
            lastOptionSelected = "";
            setTimeout(displayMenuAfterAction, 1500);
            return;
        }

        if (currentContext === "rota" && lastOptionSelected === "4") {
            displayMessage("✅ Observações registradas: " + message, "bot-message");
            message3 = "Observações: " + message;
            enviar_planilha(cpf, message3);
            lastOptionSelected = "";
            setTimeout(displayMenuAfterAction, 1500);
            return;
        }

        if (currentContext === "rota" && lastOptionSelected === "5" && isNumber) {
            displayMessage("✅ Custos registrados: R$ " + message, "bot-message");
            message4 = "Custos: R$ " + message;
            enviar_planilha(cpf, message4);
            lastOptionSelected = "";
            setTimeout(displayMenuAfterAction, 1500);
            return;
        }

        lastOptionSelected = message;

        if (currentContext === "embarque") {
            const responses = {
                "1": `Local: ${user.embarqueLocal}\nResponsável: ${user.embarqueResponsavel}`,
                "2": `Tipo de carga: ${user.tipoCarga}`,
                "3": "Envie a foto da carga no embarque:",
                "4": "Digite o KM inicial:"
            };
            displayMessage(responses[message] || "Opção inválida.", "bot-message");

        } else if (currentContext === "rota") {
            const responses = {
                "1": "Instale o Waze ou acesse: https://www.waze.com/pt-BR/live-map/",
                "2": "Paradas: " + user.paradasProgramadas,
                "3": "Acesse a rota: https://www.waze.com/pt-BR/live-map/",
                "4": "Digite suas observações:",
                "5": "Digite os custos da viagem:"
            };
            displayMessage(responses[message] || "Opção inválida.", "bot-message");

        } else if (currentContext === "desembarque") {
            const responses = {
                "1": `Local: ${user.desembarqueLocal}\nResponsável: ${user.desembarqueResponsavel}`,
                "2": "Envie a foto da carga no desembarque:",
                "3": "Digite o KM final:"
            };
            displayMessage(responses[message] || "Opção inválida.", "bot-message");

        } else if (currentContext === "contato") {
            const responses = {
                "1": "Emergência: 192\nSOS Estradas:\nhttps://postocidadedemarilia.com.br/telefone-de-emergencia-das-rodovias-guia/",
                "2": "Supervisor Otávio: (34) 9 9894-2493",
                "3": "Ouvidoria: ouvidoria@oliveiratransportes.com.br"
            };
            displayMessage(responses[message] || "⚠️ Opção inválida.", "bot-message");
            setTimeout(displayMenuAfterAction, 1000);
        }
    }

    function displayMenu(contexto) {
        const menus = {
            "embarque": `Embarque:\n1️⃣ Local e responsável\n2️⃣ Tipo de carga\n3️⃣ Enviar foto da carga\n4️⃣ KM inicial\n0️⃣ Voltar`,
            "rota": `Rota:\n1️⃣ Abrir mapa\n2️⃣ Ver paradas\n3️⃣ Ver rota\n4️⃣ Registrar observações\n5️⃣ Registrar custos\n0️⃣ Voltar`,
            "desembarque": `Desembarque:\n1️⃣ Local e responsável\n2️⃣ Enviar foto da carga\n3️⃣ KM final\n0️⃣ Voltar`,
            "contato": `Contatos:\n1️⃣ Emergência\n2️⃣ Supervisor\n3️⃣ Ouvidoria\n0️⃣ Voltar`
        };
        displayMessage(menus[contexto] || "⚠️ Menu não disponível.", "bot-message");
    }

    function displayMenuAfterAction() {
        if (currentContext) {
            displayMenu(currentContext);
        } else {
            displayMainMenu();
        }
    }
});
