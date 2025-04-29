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