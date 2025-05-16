const mesasContainerAtendente = document.getElementById('mesas-atendente');
        
const mesas = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, status: 'disponível' }));

mesas.forEach(mesa => {
    const mesaDiv = document.createElement('div');
    mesaDiv.classList.add('mesa');
    mesaDiv.textContent = `Mesa ${mesa.id}`;
    mesaDiv.onclick = async () => {
        try {
        const resposta = await fetch(`http://localhost:3000/mostrar_reservas_nao_confirmadas?mesa=${mesa.id}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });

        const dados = await resposta.json();

        if (dados && dados.length > 0) {
            const listaReservas = dados.map(reserva => {
                return `
                    <div class="reserva-container" data-id="${reserva.id}">
                        <p><strong>Id:</strong> ${reserva.id}</p>
                        <p><strong>Nome:</strong> ${reserva.nome_responsavel}</p>
                        <p><strong>Data:</strong> ${reserva.data_reserva}</p>
                        <p><strong>Hora:</strong> ${reserva.hora}</p>
                        <p><strong>Mesa:</strong> ${reserva.mesa}</p>
                        <p><strong>Qtd. Pessoas:</strong> ${reserva.qtd_pessoas}</p>
                        <p><strong>Status:</strong> ${reserva.status}</p>
                        <select class="status-atualizado" required>
                            <option value="">Selecione um status...</option>
                            <option value="Reserva Confirmada">Reserva Confirmada</option>
                            <option value="Reserva não confirmada">Reserva não confirmada</option>
                        </select>
                        <input type="text" placeholder="observação" class="observacao">
                        <button class="btn-atualizar">Atualizar</button>
                        <hr>
                    </div>
                `;
            }).join('');
            document.getElementById('mostrar_resposta').innerHTML = listaReservas;

            document.querySelectorAll('.btn-atualizar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const container = this.closest('.reserva-container');
                    const id = container.getAttribute('data-id');
                    const status = container.querySelector('.status-atualizado').value;
                    const observacao = container.querySelector('.observacao').value;
                    const garcomId = localStorage.getItem('usuario_id');

                    atualizar(id, status, observacao, garcomId)
                });
            });
        } else {
            document.getElementById('mostrar_resposta').innerText = 'Nenhuma reserva'
        }

        if (!resposta.ok) {
            // API retornou erro (status 4xx ou 5xx)
            console.error('Erro da API:', dados);
            alert(`Erro: ${dados.mensagem}\nDetalhe: ${dados.detalhe}`);
        }

    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
    }
    };
    mesasContainerAtendente.appendChild(mesaDiv);
});

async function atualizar(id, status, descricao, garcom_id) {

    const container_atualizar = {
        id: id,
        status: status,
        descricao: descricao,
        garcom_id: garcom_id
    }

    try {
        const resposta = await fetch("http://localhost:3000/confirmacao_garcom", {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(container_atualizar)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error('Erro da API:', dados);
            alert(`Erro: ${dados.error}`);
        } else {
            console.log('Reserva atualizada com sucesso:', dados);
            alert('Reserva atualizada com sucesso!');
        }
    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
    }
}