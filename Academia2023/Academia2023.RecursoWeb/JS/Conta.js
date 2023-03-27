if (typeof (Academia) == "undefined") { Academia = {}; }

Academia.Conta = {
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
        Academia.Conta.formContext = executionContext.getFormContext();
        Academia.Conta.OnChange();
    },

    /**
    * Função responsável pela configuração dos eventos de modificações dos campos, ela deve sempre ser chamada no carregamento da página
    */
    OnChange: function (formContext) {
        Academia.Conta.formContext.getAttribute(Academia.Conta.campoCnpj).addOnChange(Academia.Conta.ConsultarCnpj);
    },

    OnSave: function (formContext) {
        Academia.Conta.saveContext = executionContext.getFormContext();
    },

    //https://developers.receitaws.com.br/#/operations/queryCNPJFree documentacao
    ConsultarCnpj: function () {

        if (Academia.Conta.formContext.ui.getFormType() !== 1)
            return;

        let urlFlow = "https://prod-07.brazilsouth.logic.azure.com:443/workflows/8589639552014088a21076c6d96b003e/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=Uwjhr0tiETfIxeUWOv0JWj3v43xNyX1slMtwWEo2IJ0";
        try {
            let cnpj = Academia.Conta.formContext.getAttribute(Academia.Conta.campoCnpj).getValue();
            cnpj = cnpj.replace(/\D/g, "");

            if (Academia.Conta.ValidarCnpj(cnpj)) {
                Academia.Conta.formContext.getControl(Academia.Conta.campoCnpj).clearNotification("cnpjErro");
            }
            else {
                Academia.Conta.formContext.getControl(Academia.Conta.campoCnpj).setNotification("cnpj inválido!", "cnpjErro");
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
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoNome).setValue(result.nome);
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoTel).setValue(result.telefone);
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoCapital).setValue(parseFloat(result.capital_social));
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoRua).setValue(result.logradouro);
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoCidade).setValue(result.municipio);
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoEstado).setValue(result.uf);
            Academia.Conta.formContext.getAttribute(Academia.Conta.campoCep).setValue(result.cep);
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
    }
}