using Microsoft.Xrm.Sdk;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Configuration;
using Microsoft.Xrm.Sdk.Query;

namespace Academia.Console
{
    class Program
    {
        static void Main(string[] args)
        {
            System.Console.WriteLine("Iniciando Conexão com o CRM");
            IOrganizationService serviceOrigem = Conn.GerarService(ConfigurationManager.AppSettings["ConexaoAppSecrect"]);
            System.Console.WriteLine("Conexão estabelecida com o CRM");

            Academia academia = new Academia();
          
            Guid idRegistro = academia.CriarRegistro(serviceOrigem);
            System.Console.WriteLine("Registro com ID: {0} criado", idRegistro.ToString());
          
            academia.AtualizarRegistro(serviceOrigem, idRegistro);
            System.Console.WriteLine("Registro com ID: {0} atualizado", idRegistro.ToString());
            
            academia.DeletarRegistro(serviceOrigem, idRegistro);
            System.Console.WriteLine("Registro com ID: {0} deletado", idRegistro.ToString());
        }
    }

    public class Academia
    {
        public EntityReference RetornarCategoriaTerror(IOrganizationService service)
        {
            QueryExpression query = new QueryExpression();
            query.EntityName = "academia_categoriadefilmes";
            query.Criteria.AddCondition("academia_nome", ConditionOperator.Equal, "Terror");
            Entity categoriaFilmes = service.RetrieveMultiple(query).Entities.FirstOrDefault();

            return categoriaFilmes.ToEntityReference();
        }

        public EntityReference RetornarContato(IOrganizationService service)
        {
            QueryExpression query = new QueryExpression();
            query.EntityName = "contact";
            query.Criteria.AddCondition("emailaddress1", ConditionOperator.Equal, "someone_h@example.com");
            Entity contato = service.RetrieveMultiple(query).Entities.FirstOrDefault();

            return contato.ToEntityReference();
        }

        public Guid CriarRegistro(IOrganizationService service)
        {

            EntityReference categoria = RetornarCategoriaTerror(service);
            EntityReference contato = RetornarContato(service);

            Entity criarAluguelDeFilme = new Entity("academia_alugueldefilmes");
            criarAluguelDeFilme["academia_haquantotempoconhecealocadora"] = new OptionSetValue(645870003); //seis meses
            criarAluguelDeFilme["academia_nome"] = "Aluguel criado pela console";
            criarAluguelDeFilme["academia_contato"] = contato;
            criarAluguelDeFilme["academia_categoriadefilmes"] = categoria;

            Guid idRegistro = service.Create(criarAluguelDeFilme);
            return idRegistro;
        }

        public void AtualizarRegistro(IOrganizationService service, Guid id)
        {
            Entity atualizarAluguelDeFilme = new Entity("academia_alugueldefilmes", id);

            atualizarAluguelDeFilme["academia_haquantotempoconhecealocadora"] = new OptionSetValue(645870004); //um ano ou mais meses
            atualizarAluguelDeFilme["academia_nome"] = "Aluguel atualizado pela console";

            service.Update(atualizarAluguelDeFilme);
        }

        public void DeletarRegistro(IOrganizationService service, Guid id)
        {

            service.Delete("academia_alugueldefilmes", id);
        }
    }

}
