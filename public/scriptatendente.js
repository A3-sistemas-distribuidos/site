const mesasContainerAtendente = document.getElementById('mesas-atendente');
const modalReserva = document.getElementById('modal-reserva');
const numeroMesaModal = document.getElementById('numero-mesa');
const horariosMesaDiv = document.getElementById('horarios-mesa');
const formularioReservaDiv = document.getElementById('formulario-reserva');

let reservaAtual = {};
let data_reserva;

const mesas = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, status: 'disponível' }));

mesas.forEach(mesa => {
    const mesaDiv = document.createElement('div');
    mesaDiv.classList.add('mesa');
    mesaDiv.textContent = `Mesa ${mesa.id}`;
    mesaDiv.onclick = () => {
        const data_reserva_inicial = document.getElementById('data_reserva_inicial').value;
        data_reserva = data_reserva_inicial;
        if (!data_reserva_inicial) {
            alert("Por favor, selecione uma data antes de escolher a mesa!")
            return
        }
        mostrarHorarios(mesa.id, data_reserva_inicial)
    };
    mesasContainerAtendente.appendChild(mesaDiv);
});

async function mostrarHorarios(mesaId, data_reserva_inicio) {
    numeroMesaModal.textContent = mesaId;
    horariosMesaDiv.innerHTML = ''; 
    formularioReservaDiv.style.display = 'none';
    modalReserva.style.display = 'block';


    try {

        const resposta = await fetch(`http://localhost:3000/verificar_status?mesa=${mesaId}&data_reserva=${data_reserva_inicio}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });

        const horarios = [
            { hora: '18:00:00', status: 'disponível' },
            { hora: '19:00:00', status: 'disponível' },
            { hora: '20:00:00', status: 'disponível' },
            { hora: '21:00:00', status: 'disponível' }
        ];

        const dados = await resposta.json();

        if (dados.status === 1) {
            horarios.forEach(horario => {
                const horarioDiv = document.createElement('div');
                horarioDiv.textContent = `${horario.hora} - Status: ${horario.status}`;
                horarioDiv.style.cursor = 'pointer';
                horarioDiv.onclick = () => {
                    reservaAtual = {mesa: mesaId, hora: horario.hora};
                    mostrarFormularioReserva(mesaId, horario.hora)
                };
                horariosMesaDiv.appendChild(horarioDiv);
            });
        } else {

        const verificacao = dados.map(dado => ({
            hora: dado.hora,
            status: dado.status
        }));

        const horariosReservados = new Map();
        verificacao.forEach(item => {
            horariosReservados.set(item.hora, item.status);
        });

        const resultadoCompleto = horarios.map(item => {
            const statusReservado = horariosReservados.get(item.hora);
            return {
                hora: item.hora,
                status: statusReservado || item.status
            };
        });

        resultadoCompleto.forEach(dado => {
            const horarioDiv = document.createElement('div');
            horarioDiv.textContent = `${dado.hora} - Status: ${dado.status}`;
            if (dado.status === 'disponível') {
                horarioDiv.style.cursor = 'pointer';
                horarioDiv.onclick = () => {
                    reservaAtual = {mesa: mesaId, hora: dado.hora};
                    mostrarFormularioReserva(mesaId, dado.hora); 
                };
            } else {
                horarioDiv.style.cursor = 'pointer';
                horarioDiv.onclick = () => {
                    reservaAtual = {mesa: mesaId, hora: dado.hora};
                    mostrarReservas(mesaId, data_reserva, dado.hora); 
                };
            }
            horariosMesaDiv.appendChild(horarioDiv);
        })
    }

    } catch (error) {
        console.log('erro na comunicação da api');
    }
}

function mostrarFormularioReserva(mesaId, horario) {
    horariosMesaDiv.style.display = 'none';
    formularioReservaDiv.style.display = 'block';
    
}

document.getElementById('formulario-reserva').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reserva = {
        nome_responsavel: document.getElementById("nome_responsavel").value,
        data_reserva: data_reserva,
        hora: reservaAtual.hora,
        mesa: reservaAtual.mesa,
        qtd_pessoas: document.getElementById("qtd_pessoas").value,
        cpf: document.getElementById("cpf").value,
        forma_pagamento: document.getElementById("forma_pagamento").value
    }

    try {
        const resposta = await fetch('http://localhost:3000/postar_reserva', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(reserva)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error('Erro da API', dados);
            alert(`${dados.mensagem}`)
        } else {
            console.log('Reserva criada com sucesso: ', dados);
            alert('Reserva criada com sucesso!');
        }
    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
    }
});

async function mostrarReservas(mesa, data_reserva, hora) {
    try{
        const resposta = await fetch(`http://localhost:3000/mostrar_reservas_nao_confirmadas?mesa=${mesa}&data_reserva=${data_reserva}&hora=${hora}`, {
            method: 'GET',
            headers: {'Content-Type': 'application/json'}
        });

        if (!resposta.ok) {
            // API retornou erro (status 4xx ou 5xx)
            console.error('Erro da API:', dados);
            alert(`Erro: ${dados.mensagem}\nDetalhe: ${dados.detalhe}`);
        }
    
        const [reserva] = await resposta.json();

        if (reserva && reserva.id) {
            const htmlReserva = `
                    <div>
                        <p><strong>Id:</strong> ${reserva.id}</p>
                        <p><strong>Nome:</strong> ${reserva.nome_responsavel}</p>
                        <p><strong>Data:</strong> ${reserva.data_reserva}</p>
                        <p><strong>Hora:</strong> ${reserva.hora}</p>
                        <p><strong>Mesa:</strong> ${reserva.mesa}</p>
                        <p><strong>Qtd. Pessoas:</strong> ${reserva.qtd_pessoas}</p>
                        <p><strong>Status:</strong> ${reserva.status}</p>
                        <button Onclick="cancelar(${reserva.id})">Cancelar</button>
                        <hr>
                    </div>
                `;
                document.getElementById('mostrar_resposta').innerHTML = htmlReserva;
        } else {
            document.getElementById('mostrar_resposta').innerText = 'Nenhuma reserva'
        }
    } catch (error) {
        console.error('Erro ao conectar com o servidor:', error);
        alert('Erro ao conectar com o servidor.');
}}

async function cancelar(id) {
    try {

        const resposta = await fetch("http://localhost:3000/cancelar_reserva", {
            method: 'PATCH',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id})
        });
        if (!resposta.ok) {
            const erro = await resposta.json();
            console.error('Erro da API:', erro);
            alert(`Erro: ${erro.message || erro}`);
            return;
        }
        const dados_cancelar = await resposta.json();
        console.log('Reserva cancelada com sucesso:', dados_cancelar);
        alert('Reserva cancelada com sucesso!');

        location.reload();
    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
    }
}

function fecharModal() {
    modalReserva.style.display = 'none';
    horariosMesaDiv.style.display = 'block';
}