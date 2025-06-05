document.getElementById('relatorio').addEventListener("submit", async (e) => {
    e.preventDefault();

    const corpoTabela = document.getElementById('corpo-tabela');
    const relatorio = {
        mesa: document.getElementById('mesa_relatorio').value || null,
        status: document.getElementById('status_relatorio').value,
        data_inicio: document.getElementById('data_inicio').value,
        data_final: document.getElementById('data_final').value,
        nomeGarcom: document.getElementById('nomeGarcom').value
    };

    try {
        const resposta = await fetch('http://localhost:3000/relatorio', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(relatorio)
        });

        const dados_resposta = await resposta.json();

        const dados = dados_resposta.dados;

        if (!dados) {
            alert(`${dados_resposta.error}`)
        } else {
            corpoTabela.innerHTML = ''; 
            dados.forEach(dado => {
                const linha = corpoTabela.insertRow();
                linha.insertCell().textContent = dado.mesa;
                linha.insertCell().textContent = dado.nome_responsavel;
                linha.insertCell().textContent = dado.cpf;
                linha.insertCell().textContent = dado.qtd_pessoas;
                linha.insertCell().textContent = dado.data_reserva;
                linha.insertCell().textContent = dado.hora;
                linha.insertCell().textContent = dado.status;
                if (dado.id_garcom && dado.id_garcom.nome) {
                    linha.insertCell().textContent = dado.id_garcom.nome;
                } else {
                    linha.insertCell().textContent = "Sem confirmação do garçom";                    
                }
                linha.insertCell().textContent = dado.descricao;
            });
        }

        if (dados_resposta.excel) {
            const link = document.createElement('a');
            link.href = `data:${dados_resposta.excel.mimeType};base64,${dados_resposta.excel.data}`;
            link.download = dados_resposta.excel.fileName;
            link.click();
        }

    } catch (erro) {
        console.error('Erro:', erro);
        if (!erro.message.includes('The user aborted a request')) {
            alert(erro.message || 'Erro ao gerar relatório');
        }
    }
});