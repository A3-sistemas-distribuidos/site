//importações
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {createClient} = require('@supabase/supabase-js');
const path = require('path');

//atribuições dos middlewares
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

//ligação com o supabase
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

//endpoint responsavel por retornar a relacao do login
app.post('/login', async (req, res) => {
    try {
        //pega as variáveis de nome e senha do front-end
        const {nome, senha} = req.body;

        //faz a consulta no banco de dados com os dados vindos do front
        const {data: consultaLogin, error: erroBusca} = await supabase.from("cadastro").select("id, relacao")
            .eq("nome", nome).eq("senha_simulada", senha).maybeSingle();
        
        //caso dê erro na busca
        if (erroBusca) {
            return res.status(500).json({error: "Erro ao buscar reserva"});
        }

        //caso o cadastro não exista
        if (consultaLogin === null) {
            return res.status(404).json({error: 'Cadastro não encontrado'});
        }

        //retorna um json com a relacao
        res.json({
            relacao: consultaLogin.relacao,
            id: consultaLogin.id
        });
    } catch (error) {
        console.error('Erro ao consultar cadastro:', error);
        res.status(500).json({
            mensagem: 'Error ao consultar cadastro',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null})
    }
});

//endpoint responsável por postar a reserva
app.post('/postar_reserva', async (req, res) => {
    try {
        //atribuição de variáveis vindas do front-end
        const {nome_responsavel, data_reserva, hora, mesa, qtd_pessoas} = req.body;
        
        //consulta que vai ser responsável por dizer se já há uma reserva com aqueles dados
        const {data: reservaExistente, error: erroConsulta} = await supabase.from('reserva').select('*')
            .eq('mesa', mesa).eq('data_reserva', data_reserva).eq('hora', hora).maybeSingle();

        //Caso a consulta dê erro
        if (erroConsulta) throw erroConsulta;

        //caso já exista a reserva retorna a resposta
        if (reservaExistente) {
            return res.status(400).json({
                sucess: false,
                mensagem: 'Já existe uma reserva para esta mesa no horário selecionado',
                reserva_existente: reservaExistente
            })
        }

        //responsável por colocar a reserva no banco
        const {data: novaReseva, error: erroInsercao} = await supabase.from('reserva').insert({
            nome_responsavel: nome_responsavel,
            data_reserva: data_reserva,
            hora: hora,
            mesa: mesa,
            qtd_pessoas: qtd_pessoas
        }).select().single();

        //caso dê erro na inserção
        if (erroInsercao) throw erroInsercao;

        //retorno caso a inserção seja feita corretamente
        res.status(201).json({
            sucess: true,
            mensagem: 'Reserva criada com sucesso',
            reserva: novaReseva
        });

    } catch (error) {
        console.error('Erro ao criar reserva:', error);

        res.status(500).json({
            sucess: false,
            mensagem: 'Error ao criar reserva',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null
        });
    }
});

//endpoint responsável por deletar a reserva selecionada
app.delete('/deletar_reserva', async (req, res) => {
    try {
        //responsável por pegar os parâmetros de entrada
        const {id} = req.body;

        //faz a consulta no banco de dados
        const {data: reserva_existente, error: queryError} = await supabase.from('reserva')
            .select('*').eq('id', id).maybeSingle();
        
        //caso dê erro na leitura da query
        if (queryError) {
            return res.status(500).json({error: 'Erro ao buscar reserva.'});
        }

        //caso a reserva não exista
        if (!reserva_existente) {
            return res.status(404).json({error: 'Reserva não encontrada.'});
        }

        //caso ela exista irá deletar
        const {error: erroDelete} = await supabase.from('reserva').delete()
            .eq('id', id);
        
        //caso dê erro no delete
        if (erroDelete) {
            return res.status(500).json({error: 'Erro ao deletar a reserva.'});
        }

        //resposta positiva caso seja deletado
        res.status(201).json({
            sucess: true,
            mensagem: 'Reserva deletada com sucesso',
        });

    } catch (error) {
        console.error('Erro ao deletar reserva:', error);

        res.status(500).json({
            sucess: false,
            mensagem: 'Error ao deletar reserva',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null
        });
    }
});

//endpoint de atualizacao de valores utilizado pelo garcom
app.patch('/confirmacao_garcom', async (req, res) => {
    try {
        //variaveis que virão do front
        const {id, descricao, status, garcom_id} = req.body;

        console.log(garcom_id);

        //variáveis pre definidas
        const data_confirmacao = new Date().toLocaleString('pt-BR', {
            timeZone: 'America/Sao_Paulo',
            hour12: false
        }).replace(/(\d{2})\/(\d{2})\/(\d{4}), (\d{2}:\d{2}:\d{2})/, '$3-$2-$1T$4.000Z');

        //consulta separada para saber se existe uma reserva com o id fornecido
        const {data: reservaExistente, error: erroBusca} = await supabase.from('reserva').select('id')
            .eq('id', id).maybeSingle();

        //caso dê erro na busca
        if (erroBusca) {
            return res.status(500).json({error: "Erro ao buscar reserva"});
        }

        //caso a reserva não exista
        if (!reservaExistente) {
            return res.status(404).json({error: 'Reserva não encontrada'});
        }

        //vai atualizar a reserva com os dados novos
        const {data: reservaAtualizada, error: erroAtualizacao} = await supabase.from('reserva')
            .update({status: status, id_garcom: garcom_id, data_confirmacao: data_confirmacao, descricao: descricao})
            .eq('id', id).select();
        
        //caso dê erro na atualização
        if (erroAtualizacao) {
            return res.status(500).json({error: 'Erro ao atualizar.'})
        }

        //retorna resposta caso seja bem sucedido
        return res.status(200).json({success: true, mensagem: 'Reseva atualizada com sucesso'})
    } catch (error){
        console.error('Erro ao atualizar reserva:', error);

        res.status(500).json({
            success: false,
            mensagem: 'Error ao atualizar reserva',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null
        });
    }
})

//endpoint responsável por retornar as reservas não confirmadas pelo garçom
app.get('/mostrar_reservas_nao_confirmadas', async (req, res) => {
    try {
        //pega a variável mesa
        const {mesa} = req.query;

        //query responsável por fazer a seleção dos dados relevantes
        let query = supabase.from('reserva').select(`
            id,
            nome_responsavel,
            data_reserva,
            hora,
            mesa,
            qtd_pessoas,
            status,
            data_confirmacao
            `);
        
        //filtros aplicados para que retorne apenas as mesas que não foram confirmadas
        if (mesa) query = query.eq('mesa', mesa);
        query = query.is('data_confirmacao', null);
        
        //atribui os resultados para a variavel data
        const {data, error} = await query;
        
        //Joga o erro caso a consulta dê falha
        if (error) throw error;
        
        //retorna a resposta
        res.json(data);
    } catch (error) {
        console.error('Erro ao consultar reserva:', error);

        res.status(500).json({
            mensagem: 'Error ao consultar reserva',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null})
    }
});


app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000")
})