const modalGarcom = document.getElementById('modal-garcom');
const conteudoModalGarcom = document.getElementById('conteudo-modal-garcom');
const numeroMesaGarcom = document.getElementById('numero-mesa-garcom');

document.addEventListener('DOMContentLoaded', function() {
    const mesasContainer = document.getElementById('mesas-container');
    
    // Cria as 10 mesas com imagens
    for (let i = 1; i <= 10; i++) {
        const mesaImg = document.createElement('img');
        mesaImg.src = `./assets/garcom/mesa${i}.png`;
        mesaImg.className = 'mesa-img';
        mesaImg.alt = `Mesa ${i}`;
        mesaImg.onclick = async () => {
            try {

                numeroMesaGarcom.textContent = i;
                modalGarcom.style.display = 'block';
                conteudoModalGarcom.innerHTML = '<p>Carregando reservas...</p>';

                const resposta = await fetch(`http://localhost:3000/mostrar_reservas_nao_confirmadas?mesa=${i}`, {
                    method: 'GET',
                    headers: {'Content-Type': 'application/json'}
                });

                const dados = await resposta.json();

                if (dados && dados.length > 0) {
                    renderizarReservasNoModal(dados);
                } else {
                    conteudoModalGarcom.innerHTML = "<p>Nenhuma reserva encontrada para esta mesa.</p>";
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
        mesasContainer.appendChild(mesaImg);
    };
});

function renderizarReservasNoModal(reservas) {
    let html = '';
    
    reservas.forEach(reserva => {
        html += `
            <div class="reserva-item" data-id="${reserva.id}">
                <div class="reserva-info">
                    <p><strong>ID:</strong> ${reserva.id}</p>
                    <p><strong>Nome:</strong> ${reserva.nome_responsavel}</p>
                    <p><strong>Data:</strong> ${reserva.data_reserva}</p>
                    <p><strong>Hora:</strong> ${reserva.hora}</p>
                    <p><strong>Pessoas:</strong> ${reserva.qtd_pessoas}</p>
                    <p><strong>Status atual:</strong> ${reserva.status}</p>
                </div>
                
                <form class="form-garcom">
                <div class="reserva-controles">
                    <label>Atualizar status:</label>
                    <select class="status-atualizado" required>
                        <option value="">Selecione...</option>
                        <option value="Reserva Confirmada" ${reserva.status === 'Reserva Confirmada' ? 'selected' : ''}>Confirmada</option>
                        <option value="Reserva não confirmada" ${reserva.status === 'Reserva não confirmada' ? 'selected' : ''}>Não confirmada</option>
                    </select>
                    
                    <label>Observação:</label>
                    <input type="text" class="observacao" placeholder="Digite uma observação" value="${reserva.descricao || ''}">
                    
                    <button type="submit" class="btn-atualizar" data-id="${reserva.id}">Atualizar Reserva</button>
                </div>
                </form>
            </div>
            <hr>
        `;
    });
    
    conteudoModalGarcom.innerHTML = html;
    document.querySelectorAll('.form-garcom').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const btn = this.querySelector('.btn-atualizar');
            const reservaId = btn.getAttribute('data-id');
            const reservaItem = btn.closest('.reserva-item');
            const status = reservaItem.querySelector('.status-atualizado').value;
            const observacao = reservaItem.querySelector('.observacao').value;
            const garcomId = localStorage.getItem('usuario_id');
            
            atualizar(reservaId, status, observacao, garcomId);
        });
    });
}



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
            const mesaNumero = numeroMesaGarcom.textContent;
            const respostaRefresh = await fetch(`http://localhost:3000/mostrar_reservas_nao_confirmadas?mesa=${mesaNumero}`);
            const novasReservas = await respostaRefresh.json();
        
            if (novasReservas && novasReservas.length > 0) {
                renderizarReservasNoModal(novasReservas);
            } else {
                conteudoModalGarcom.innerHTML = "<p>Nenhuma reserva encontrada para esta mesa.</p>";
                fecharModalGarcom(); // Opcional: fecha o modal se não houver mais reservas
            }
            console.log('Reserva atualizada com sucesso:', dados);
            alert('Reserva atualizada com sucesso!');
        }
    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
    }
}

function fecharModalGarcom() {
    modalGarcom.style.display = 'none';
}
