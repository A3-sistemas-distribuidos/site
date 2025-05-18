document.getElementById("login").addEventListener("submit", async (e) => {

    e.preventDefault();
    const valores = {
        nome: document.getElementById("usuario").value,
        senha: document.getElementById("senha").value
    }

    try {
        const resposta = await fetch(`http://localhost:3000/login`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(valores)
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
            console.error('Erro da API:', dados);
            alert(`Erro: ${dados.error}`);
        } else {
            alert('Cadastro encontrado com sucesso!');

            localStorage.setItem('usuario_id', dados.id);
            localStorage.setItem('usuario_relacao', dados.relacao);
        }

        switch (dados.relacao) {
            case "atendente":
                window.location.href = "/atendente.html";
                break;
            case "garcom":
                window.location.href = `/garcom.html?id=${dados.id}`;
                break;
            case "gerente":
                window.location.href = "/gerente.html"
                break;
        }

    } catch (erro) {
        console.error('Erro ao conectar com o servidor:', erro);
        alert('Erro ao conectar com o servidor.');
    }
})