const sheetUrl = 'https://api.sheety.co/7a6b39da1af36e7ace5d2c61d043fcdf/chatMotoristas/motoristas';

document.addEventListener("DOMContentLoaded", function () {
    if (window.chatInitialized) return;
    window.chatInitialized = true;

    let cpf = "";
    let chatBox = document.getElementById("chat-box");
    let userInput = document.getElementById("user-input");
    let fileInput = document.getElementById("file-input");
    let attachButton = document.getElementById("attach-button");
    let sendButton = document.getElementById("send-button");
    let currentContext = "";
    let lastOptionSelected = "";
    let usersData = {};

    function carregarMotoristas() {
        fetch(sheetUrl)
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
                    displayMainMenu();
                }
            })
            .catch(error => {
                console.error("Erro ao buscar motoristas:", error);
            });
    }

    if (navigator.onLine) carregarMotoristas();
    window.addEventListener('online', carregarMotoristas);

    function verificarStatus() {
        const statusDot = document.getElementById('status-dot');
        const statusText = document.getElementById('status-text');
        const statusIndicator = document.getElementById('status-indicator');

        if (!statusDot || !statusText) return;

        const isOnline = navigator.onLine;
        if (statusIndicator) {
            statusIndicator.style.display = 'flex';
        }

        if (isOnline) {
            statusDot.classList.remove('offline');
            statusDot.classList.add('online');
            statusText.textContent = 'Você está online';
        } else {
            statusDot.classList.remove('online');
            statusDot.classList.add('offline');
            statusText.textContent = 'Você está offline';
        }

        if (statusIndicator) {
            statusIndicator.classList.add('status-updated');
            setTimeout(() => {
                statusIndicator.classList.remove('status-updated');
            }, 1000);
        }
    }

    window.addEventListener('online', verificarStatus);
    window.addEventListener('offline', verificarStatus);
    verificarStatus();

    function enviarParaFormsubmit(data, contexto) {
        const formData = new FormData();
        for (const key in data) {
            formData.append(key, data[key]);
        }
        formData.append("_subject", `📌 Atualizações de ${contexto} - CPF ${data.cpf}`);
        formData.append("_captcha", "false");

        fetch("https://formsubmit.co/transporte.oliveira583@gmail.com", {
            method: "POST",
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            displayMessage("✅ Informações enviadas!", "bot-message");
            lastOptionSelected = "";
            displayMenuAfterAction();
        })
        .catch(error => {
            console.error(error);
            displayMessage("❌ Erro ao enviar informações. Tente novamente mais tarde.", "bot-message");
            setTimeout(() => {
                displayMenuAfterAction();
            }, 1500);
        });
    }

    function enviarImagemParaFormsubmit(file, cpf, contexto) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("cpf", cpf);
        formData.append("_subject", `📸 Foto de ${contexto} enviada - CPF ${cpf}`);
        formData.append("_captcha", "false");

        fetch("https://formsubmit.co/transporte.oliveira583@gmail.com", {
            method: "POST",
            body: formData
        })
        .then(response => {
            if (response.ok) {
                displayMessage("✅ Foto enviada!", "bot-message");
                lastOptionSelected = "";
                displayMenuAfterAction();
            } else {
                throw new Error("Erro ao enviar foto");
            }
        })
        .catch(error => {
            console.error(error);
            displayMessage("❌ Erro ao enviar foto. Tente novamente mais tarde.", "bot-message");
            setTimeout(() => {
                displayMenuAfterAction();
            }, 1500);
        });
    }

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
    }

    function sendImage(file) {
        const envioValido =
            (currentContext === "embarque" && lastOptionSelected === "3") ||
            (currentContext === "desembarque" && lastOptionSelected === "2");

        if (!envioValido) {
            displayMessage("⚠️ Formato inválido.", "bot-message");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = function () {
            const messageDiv = document.createElement("div");
            messageDiv.classList.add("message", "user-message");

            const imgContainer = document.createElement("div");
            imgContainer.classList.add("image-container");

            const img = document.createElement("img");
            img.src = reader.result;

            imgContainer.appendChild(img);
            messageDiv.appendChild(imgContainer);
            chatBox.appendChild(messageDiv);
            chatBox.scrollTop = chatBox.scrollHeight;

            if (currentContext === "embarque" && lastOptionSelected === "3") {
                enviarImagemParaFormsubmit(file, cpf, "embarque");
            } else if (currentContext === "desembarque" && lastOptionSelected === "2") {
                enviarImagemParaFormsubmit(file, cpf, "desembarque");
            }
        };
        reader.readAsDataURL(file);
    }

    if (fileInput && attachButton) {
        attachButton.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", () => {
            if (fileInput.files.length > 0) {
                sendImage(fileInput.files[0]);
                fileInput.value = "";
            }
        });
    }

    function handleCPFInput(message) {
        const inputCPF = message.replace(/\D/g, "");
        if (usersData[inputCPF]) {
            cpf = inputCPF;
            displayMainMenu();
        } else {
            displayMessage("CPF não encontrado.", "bot-message");
        }
    }

    function atualizarDadosDoMotorista() {
        if (!cpf || !navigator.onLine) return;

        fetch(sheetUrl)
            .then(response => response.json())
            .then(data => {
                const atualizado = data.motoristas.find(m => m.cpf === cpf);
                if (atualizado) {
                    usersData[cpf] = {
                        nome: atualizado.nome,
                        tipoCarga: atualizado.tipoCarga,
                        embarqueLocal: atualizado.embarqueLocal,
                        embarqueResponsavel: atualizado.embarqueResponsavel,
                        desembarqueLocal: atualizado.desembarqueLocal,
                        desembarqueResponsavel: atualizado.desembarqueResponsavel,
                        paradasProgramadas: atualizado.paradasProgramadas
                    };
                    console.log("✅ Dados atualizados para CPF " + cpf);
                }
            })
            .catch(error => {
                console.error("Erro ao atualizar dados do motorista:", error);
            });
    }

    function enviar_planilha(cpf, message) {
        if (!navigator.onLine) return;

        const user = usersData[cpf];
        const payload = {
            mensagem: {
                nome: user.nome,
                conteudo: message,
                tipo: "motorista",
                timestamp: new Date().toLocaleString("pt-BR")
            }
        };

        fetch('https://api.sheety.co/7a6b39da1af36e7ace5d2c61d043fcdf/chatMotoristas/mensagem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                console.log("✅ Mensagem enviada para planilha:", data);
            })
            .catch(err => {
                console.error("❌ Erro ao enviar mensagem:", err);
            });
    }

    function displayMainMenu() {
        const user = usersData[cpf];
        displayMessage(
            `Olá, ${user.nome}! Escolha uma opção:\n1️⃣ Embarque\n2️⃣ Rota\n3️⃣ Desembarque\n4️⃣ Pós-viagem\n5️⃣ Contatos úteis`,
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
            default:
                displayMessage("Opção inválida. Escolha de 1 a 5.", "bot-message");
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
                "1": "Instale o Waze, disponível para Android e IOS, ou acesse: https://www.waze.com/pt-BR/live-map/",
                "2": "Paradas: " + user.paradasProgramadas,
                "3": "Instale o Waze, disponível para Android e IOS, ou acesse: https://www.waze.com/pt-BR/live-map/",
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
                "1": "Emergência 24h:\n192\nSOS Estradas:\nhttps://postocidadedemarilia.com.br/telefone-de-emergencia-das-rodovias-guia/",
                "2": "Supervisor Otávio: (34) 9 9894-2493",
                "3": "Ouvidoria: ouvidoria@oliveiratransportes.com.br"
            };
            displayMessage(responses[message] || "⚠️ Opção inválida.", "bot-message");
            setTimeout(displayMenuAfterAction, 1000);
        }
    }

    function displayMenu(contexto) {
        const menus = {
            "embarque": `Embarque:\n1️⃣ Local e responsável\n2️⃣ Tipo de carga\n3️⃣ Enviar foto da carga\n4️⃣ KM inicial\n0️⃣ Voltar ao menu principal`,
            "rota": `Rota:\n1️⃣ Abrir mapa\n2️⃣ Ver paradas\n3️⃣ Ver rota\n4️⃣ Registrar observações\n5️⃣ Registrar custos\n0️⃣ Voltar ao menu principal`,
            "desembarque": `Desembarque:\n1️⃣ Local e responsável\n2️⃣ Enviar foto da carga\n3️⃣ KM final\n0️⃣ Voltar ao menu principal`,
            "contato": `Contatos:\n1️⃣ Emergência\n2️⃣ Supervisor\n3️⃣ Ouvidoria\n0️⃣ Voltar ao menu principal`
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
