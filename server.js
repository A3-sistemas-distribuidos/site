require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {createClient} = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_KEY
);

app.post('/postar_reserva', async (req, res) => {
    try {
        const {nome_responsavel,
            data_reserva,
            hora,
            mesa,
            qtd_pessoas
        } = req.body;
        
    const {data: reseva, error} = await supabase.from('reserva').insert({
        nome_responsavel: nome_responsavel,
        data_reserva: data_reserva,
        hora: hora,
        mesa: mesa,
        qtd_pessoas: qtd_pessoas
    }).select().single();

    if (error) throw error;

    } catch (error) {
        console.error('Erro ao criar reserva:', error);

        res.status(500).json({
            mensagem: 'Error ao criar reserva',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null})
    }
});

app.get('/mostrar_reservas_nao_confirmadas', async (req, res) => {
    try {
        const {mesa} = req.body;
        const status = null;
        let query = supabase.from('reservas').select(`
            id,
            nome_responsavel,
            data_reserva,
            hora,
            mesa,
            qtd_pessoas,
            status,
            `);
        
        if (mesa) query = query.eq('mesa', mesa);
        query = query.eq('satus', status);

        const {data, error} = await query;

        if (error) throw error;

        res.json(data);
    } catch {
        console.error('Erro ao consultar reserva:', error);

        res.status(500).json({
            mensagem: 'Error ao consultar reserva',
            detalhe: error.message || 'Error desconhecido',
            supabase: error.details || null})
    }
})


app.use(express.static("public"));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"))
});

app.listen(3000, () => {
    console.log("Servidor rodando em http://localhost:3000")
})