if (typeof (Academia) == "undefined") { Academia = {}; }

Academia.AluguelDeFilmes = {
    //definicao de contexto
    formContext: {},
    saveContext: {},
    globalContext: Xrm.Utility.getGlobalContext(),

    //definicao de campos
    campoCnpj: "academia_cnpj",
    campoTel: "telephone1",
    campoRua: "address1_line1",
    campoCapital: "revenue",
    campoCidade: "address1_city",
    campoEstado: "address1_stateorprovince",
    campoCep: "address1_postalcode",
    campoNome: "name",

    OnLoad: function (executionContext) {
        Academia.AluguelDeFilmes.formContext = executionContext.getFormContext();
        Academia.AluguelDeFilmes.OnChange();
    },

    /**
    * Função responsável pela configuração dos eventos de modificações dos campos, ela deve sempre ser chamada no carregamento da página
    */
    OnChange: function (formContext) {
        Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoCnpj).addOnChange(Academia.AluguelDeFilmes.ConsultarCnpj);
    },

    OnSave: function (formContext) {
        Academia.AluguelDeFilmes.saveContext = executionContext.getFormContext();
    },

    //https://developers.receitaws.com.br/#/operations/queryCNPJFree documentacao
    ConsultarCnpj: function () {

        if (Academia.AluguelDeFilmes.formContext.ui.getFormType() !== 1)
            return;

        let urlFlow = "https://prod-07.brazilsouth.logic.azure.com:443/workflows/8589639552014088a21076c6d96b003e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Uwjhr0tiETfIxeUWOv0JWj3v43xNyX1slMtwWEo2IJ0";
        try {
            let cnpj = Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoCnpj).getValue();
            cnpj = cnpj.replace(/\D/g, "");

            if (Academia.AluguelDeFilmes.ValidarCnpj(cnpj)) {
                Academia.AluguelDeFilmes.formContext.getControl(Academia.AluguelDeFilmes.campoCnpj).clearNotification("cnpjErro");
            }
            else {
                Academia.AluguelDeFilmes.formContext.getControl(Academia.AluguelDeFilmes.campoCnpj).setNotification("cnpj inválido!", "cnpjErro");
                return;
            }

            let result;
            let xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function () {
                if (this.readyState == 4 && this.status == 200) {
                    result = JSON.parse(this.responseText);

                }
            };
            let json = JSON.stringify({
                "CNPJ": cnpj
            });
            xhttp.open("POST", urlFlow, false);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(json);

            console.log(result);
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoNome).setValue(result.nome);
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoTel).setValue(result.telefone);
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoCapital).setValue(parseFloat(result.capital_social));
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoRua).setValue(result.logradouro);
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoCidade).setValue(result.municipio);
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoEstado).setValue(result.uf);
            Academia.AluguelDeFilmes.formContext.getAttribute(Academia.AluguelDeFilmes.campoCep).setValue(result.cep);
            Xrm.Utility.closeProgressIndicator();
        } catch (error) {
            console.log(error);
        }
    },

    ValidarCnpj: function (cnpj) {
        cnpj = cnpj.replace(/\D/g, "");
        let numeros;
        let digitos;
        let soma;
        let i;
        let resultado;
        let pos;
        let tamanho;
        let digitos_iguais;
        digitos_iguais = 1;

        if (cnpj.length < 14 && cnpj.length < 15)
            return false;

        for (i = 0; i < cnpj.length - 1; i++) {
            if (cnpj.charAt(i) != cnpj.charAt(i + 1)) {
                digitos_iguais = 0;
                break;
            }
        }

        if (!digitos_iguais) {
            tamanho = cnpj.length - 2;
            numeros = cnpj.substring(0, tamanho);
            digitos = cnpj.substring(tamanho);
            soma = 0;
            pos = tamanho - 7;

            for (i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2)
                    pos = 9;
            }

            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(0))
                return false;

            tamanho = tamanho + 1;
            numeros = cnpj.substring(0, tamanho);
            soma = 0;
            pos = tamanho - 7;
            for (i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2)
                    pos = 9;
            }

            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(1))
                return false;

            return true;
        }
        else {
            return false;
        }
    },

    /**
     * Cria um registro com possiblidade de relacionar registro e/ou criar registros relcionados, na chamada é necessário chamar dentro de um try-catch e utilizar await na frente para aguardar o resultado. 
     * Mais detalhes no Link: 
     * https://docs.microsoft.com/en-us/powerapps/developer/model-driven-apps/clientapi/reference/xrm-webapi/createrecord
     * @param {string} nomeEntidade - Nome lógico da entidade
     * @param {object} objeto - Objeto a ser criado
     * @returns {object}
     */
    CriarRegistroAsync: function (nomeEntidade, objeto) {
        return new Promise((resolve, reject) => {
            Xrm.WebApi.createRecord(nomeEntidade, objeto).then(
                (result) => {
                    resolve(result);
                },
                (e) => { reject(e); }
            );
        });
    },
    /**
    * Atualiza um Resgitro, na chamada é necessário chamar dentro de um try-catch e utilizar await na frente para aguardar o resultado. 
    * Mais detalhes no Link: 
    * https://docs.microsoft.com/en-us/powerapps/developer/model-driven-apps/clientapi/reference/xrm-webapi/updaterecord
    * @param {string} nomeEntidade - Nome lógico da entidade
    * @param {string} id Id do registro a ser atualizado ex.: CFF5AA7F-B426-EB11-BBF3-000D3A887C31
    * @param {object} objeto - Objeto a ser atualizado
    * @returns {object}
    */
    AtualizarRegistroAsync: function (nomeEntidade, id, objeto) {
        return new Promise((resolve, reject) => {
            Xrm.WebApi.updateRecord(nomeEntidade, id, objeto).then(
                (result) => { resolve(result); },
                (e) => { reject(e); }
            );
        });
    },
    /**
    * Deleta um registro
    * @param {string} nomeEntidade - Nome lógico da entidade
    * @param {string} id Id do registro a ser atualizado ex.: CFF5AA7F-B426-EB11-BBF3-000D3A887C31
    */
    DeletarRegistroAsync: function (nomeEntidade, id) {
        return new Promise((resolve, reject) => {
            Xrm.WebApi.deleteRecord(nomeEntidade, id).then(
                (result) => { resolve(result); },
                (e) => { reject(e); }
            );
        });
    },
    /**
    * Retorna apenas o registros de acordo com o Id, na chamada é necessário chamar dentro de um try-catch e utilizar await na frente para aguardar o resultado. 
    * Mais detalhes no Link: 
    * https://docs.microsoft.com/en-us/powerapps/developer/model-driven-apps/clientapi/reference/xrm-webapi/retrieverecord
    * @param {string} nomeEntidade - Nome lógico da entidade
    * @param {string} id - Id do registro a ser recuperado ex.: CFF5AA7F-B426-EB11-BBF3-000D3A887C31
    * @param {string} optionOdata -  Passa estruta odata select e expand(opcional) ex.:  "?$select=name&$expand=primarycontactid($select=contactid,fullname)"
    * @returns {object}
    */
    RetornarRegistroAsync: function (nomeEntidade, id, optionOdata) {
        return new Promise((resolve, reject) => {
            Xrm.WebApi.retrieveRecord(nomeEntidade, id, optionOdata).then(
                (result) => { resolve(result); },
                (e) => { reject(e); }
            );
        });
    },
    /**
     * Retorna um array de objetos de acordo com a busca, na chamada é necessário chamar dentro de um try-catch e utilizar await na frente para aguardar o resultado. 
     * Mais detalhes no Link: 
     * https://docs.microsoft.com/en-us/powerapps/developer/model-driven-apps/clientapi/reference/xrm-webapi/retrievemultiplerecords
     * @param {string} nomeEntidade - Nome Lógico da Entidade 
     * @param {string} optionOdata - Passa estruta odata completa com select, filter, top, etc ex.:?$select=name&$filter=campo eq 'teste' &$top=2
     * @returns {object}
     */
    RetornarRegistrosAsync: function (nomeEntidade, optionOdata) {
        return new Promise((resolve, reject) => {
            Xrm.WebApi.retrieveMultipleRecords(nomeEntidade, optionOdata).then(
                (result) => { resolve(result.entities); },
                (e) => { reject(e); }
            );
        });
    },


}