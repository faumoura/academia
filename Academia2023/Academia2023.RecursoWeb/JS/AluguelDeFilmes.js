if (typeof (Academia) == "undefined") { Academia = {}; }

Academia.AluguelDeFilmes = {
    //definicao de contexto
    formContext: {},
    saveContext: {},
    globalContext: Xrm.Utility.getGlobalContext(),

    //definicao de campos
    campoRevisao1: "academia_campo1darevisao",
    campoRevisao2: "academia_campo2revisao",
    campoConhece: "academia_haquantotempoconhecealocadora",
    campoNome: "academia_nome",
    campoContato: "academia_contato",
    campoCategoria: "academia_categoriadefilmes",
    

    OnLoad: function (executionContext) {
        Academia.AluguelDeFilmes.formContext = executionContext.getFormContext();
        Academia.AluguelDeFilmes.OnChange();
    },

    /**
    * Função responsável pela configuração dos eventos de modificações dos campos, ela deve sempre ser chamada no carregamento da página
    */
    OnChange: function (formContext) {
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRevisao1).addOnChange(Academia.AluguelDeFilmes.TornarObrigatorio);
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRevisao2).addOnChange(Academia.AluguelDeFilmes.TornarNaoObrigatorio);
    },

    OnSave: function (formContext) {
        Academia.AluguelDeFilmes.saveContext = executionContext.getFormContext();
    },

    TornarObrigatorio: async function (formContext) {
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRevisao1).setRequiredLevel("required");
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRevisao2).setRequiredLevel("required");

        let contato = Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoContato).getValue()[0].id;
        let retorno = await Academia.AluguelDeFilmes.RetornarRegistroAsync("contact", contato, "?$select=createdon");
        console.log(retorno);

        
    },
    TornarNaoObrigatorio: function (formContext) {
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRevisao1).setRequiredLevel("none");
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRevisao2).setRequiredLevel("none");

    },

    RetornarRegistroAsync: function (nomeEntidade, id, optionOdata) {

        return new Promise((resolve, reject) => {

            Xrm.WebApi.retrieveRecord(nomeEntidade, id, optionOdata).then(

                (result) => { resolve(result); },

                (e) => { reject(e); }

            );

        });

    },

}