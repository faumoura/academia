using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Sdk.Query;

namespace Academia2023.Plugins
{
    public class Academia : IPlugin //IPlugin é interface que precisa de um metodo de execute
    {
        private IPluginExecutionContext context { get; set; }
        private IOrganizationServiceFactory serviceFactory { get; set; }
        private IOrganizationService serviceUsuario { get; set; }
        private IOrganizationService serviceGlobal { get; set; }
        private ITracingService tracing { get; set; }
        public void Execute(IServiceProvider serviceProvider)
        {
            #region "Cabeçalho essenciais para o plugin"            
            context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            serviceUsuario = serviceFactory.CreateOrganizationService(context.UserId);
            serviceGlobal = serviceFactory.CreateOrganizationService(null);
            ITracingService tracing = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            #endregion

            #region "Verificador de profundidade para evitar loop"
            if (context.Depth > 1) return;
            #endregion

            #region "Mensagens de Chamadas"
            if (context.MessageName.ToLower().Trim() == "create")
            {
                if (!context.InputParameters.Contains("Target") && !(context.InputParameters["Target"] is Entity)) return;
                Entity entityContext = context.InputParameters["Target"] as Entity;
                if (context.Stage == (int)Helper.EventStage.PreOperation && context.Mode == (int)Helper.ExecutionMode.Synchronous)
                {
                    this.CalcularValorTotal(entityContext);
                }
            }

            if (context.MessageName.ToLower().Trim() == "update")
            {
                if (!context.InputParameters.Contains("Target") && !(context.InputParameters["Target"] is Entity)) return;
                Entity entityContext = context.InputParameters["Target"] as Entity;
                if (context.PreEntityImages.Contains("PreImage") && context.PreEntityImages["PreImage"] is Entity)
                {
                    Entity preImage = context.PreEntityImages["PreImage"] as Entity;
                    if (context.Stage == (int)Helper.EventStage.PreOperation && context.Mode == (int)Helper.ExecutionMode.Synchronous)
                    {
                        if (entityContext.Contains("academia_categoriadefilmes") || entityContext.Contains("academia_haquantotempoconhecealocadora"))
                            this.CalcularValorTotal(entityContext, preImage);
                    }
                }
            }

            if (context.MessageName.ToLower().Trim() == "delete")
            {
                if (!context.InputParameters.Contains("Target") && !(context.InputParameters["Target"] is EntityReference)) return;
                EntityReference referenciaContexto = (EntityReference)context.InputParameters["Target"];
                if (context.PreEntityImages.Contains("PreImage") && context.PreEntityImages["PreImage"] is Entity)
                {
                    Entity preImage = context.PreEntityImages["PreImage"] as Entity;
                    if (context.Stage == (int)Helper.EventStage.PreOperation && context.Mode == (int)Helper.ExecutionMode.Synchronous)
                    {
                        this.IncrementarCancelamento(referenciaContexto, preImage);
                    }
                }
            }
            #endregion
        }
        public void CalcularValorTotal(Entity entityContext, Entity preImage = null)
        {
            Guid idCategoria = entityContext.Contains("academia_categoriadefilmes") ? entityContext.GetAttributeValue<EntityReference>("academia_categoriadefilmes").Id : preImage.GetAttributeValue<EntityReference>("academia_categoriadefilmes").Id;

            QueryExpression query = new QueryExpression();
            query.EntityName = "academia_categoriadefilmes";
            query.ColumnSet = new ColumnSet("academia_preco");
            query.Criteria.AddCondition("academia_categoriadefilmesid", ConditionOperator.Equal, idCategoria);
            EntityCollection categoriaFilmesCollection = serviceGlobal.RetrieveMultiple(query);
            Entity categoriaFilmes = categoriaFilmesCollection.Entities.FirstOrDefault();
            Money precoCategoria = new Money(0);

            if (categoriaFilmes != null && categoriaFilmes.Contains("academia_preco") && categoriaFilmes["academia_preco"] != null)
            {
                precoCategoria = categoriaFilmes.GetAttributeValue<Money>("academia_preco");
                entityContext["academia_precoaluguel"] = precoCategoria;

            }

            Money desconto = new Money(0);
            int tempoColadora = entityContext.Contains("academia_haquantotempoconhecealocadora") ? entityContext.GetAttributeValue<OptionSetValue>("academia_haquantotempoconhecealocadora").Value : preImage.GetAttributeValue<OptionSetValue>("academia_haquantotempoconhecealocadora").Value;
            switch (tempoColadora)
            {
                case 645870000: //menos de um mes
                    desconto = new Money(2);
                    break;
                case 645870001: //um mes
                    desconto = new Money(3);
                    break;
                case 645870002: //tres meses
                    desconto = new Money(4);
                    break;
                case 645870003: //seis meses
                    desconto = new Money(5);
                    break;
                case 645870004: //um ano ou mais meses
                    desconto = new Money(6);
                    break;
                default:
                    break;
            }

            entityContext["academia_desconto"] = desconto;

            entityContext["academia_valortotal"] = new Money(precoCategoria.Value - desconto.Value);
        }

        public void IncrementarCancelamento(EntityReference referenciaContexto, Entity preImage)
        {
            if (!preImage.Contains("academia_contato"))
                throw new InvalidPluginExecutionException("Contato não vinculado.");

            Entity contatoAtualizar = new Entity(preImage.GetAttributeValue<EntityReference>("academia_contato").LogicalName, preImage.GetAttributeValue<EntityReference>("academia_contato").Id);

            Entity contatoBanco = serviceGlobal.Retrieve(contatoAtualizar.LogicalName, contatoAtualizar.Id, new ColumnSet("academia_cancelamentosdealugueis"));

            int cancelamento = contatoBanco.Contains("academia_cancelamentosdealugueis") ? contatoBanco.GetAttributeValue<int>("academia_cancelamentosdealugueis") : 0;

            contatoAtualizar["academia_cancelamentosdealugueis"] = cancelamento + 1;

            serviceUsuario.Update(contatoAtualizar);
        }
    }
}
