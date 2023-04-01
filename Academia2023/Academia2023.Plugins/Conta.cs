using Microsoft.Xrm.Sdk;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academia2023.Plugins
{
    public class Conta : IPlugin
    {

        private IPluginExecutionContext context { get; set; }
        private IOrganizationServiceFactory serviceFactory { get; set; }
        private IOrganizationService serviceUsuario { get; set; }
        private IOrganizationService serviceGlobal { get; set; }
        private ITracingService tracing { get; set; }
        public void Execute(IServiceProvider serviceProvider)
        {
            #region "Cabeçalho essenciais para o plugin"            
            //https://docs.microsoft.com/en-us/dotnet/api/microsoft.xrm.sdk.ipluginexecutioncontext?view=dynamics-general-ce-9
            //Contexto de execução
            IPluginExecutionContext context = (IPluginExecutionContext)serviceProvider.GetService(typeof(IPluginExecutionContext));
            //Fabrica de conexões
            IOrganizationServiceFactory serviceFactory = (IOrganizationServiceFactory)serviceProvider.GetService(typeof(IOrganizationServiceFactory));
            //Service no contexto do usuário
            serviceUsuario = serviceFactory.CreateOrganizationService(context.UserId);
            //Service no contexto Global (usuário System)
            serviceGlobal = serviceFactory.CreateOrganizationService(null);
            //Trancing utilizado para reastreamento de mensagem durante o processo
            tracing = (ITracingService)serviceProvider.GetService(typeof(ITracingService));
            #endregion

            #region "Verificador de profundidade para evitar loop"
            if (context.Depth > 1) return;
            #endregion

            #region "Mensagens de Chamadas"
            

            if (context.MessageName.ToLower().Trim() == "update")
            {
                if (!context.InputParameters.Contains("Target") && !(context.InputParameters["Target"] is Entity)) return;
                Entity entityContext = context.InputParameters["Target"] as Entity;
                if (context.PreEntityImages.Contains("PreImage") && context.PreEntityImages["PreImage"] is Entity)
                {
                    Entity preImage = context.PreEntityImages["PreImage"] as Entity;
                    if (context.Stage == (int)Helper.EventStage.PreOperation && context.Mode == (int)Helper.ExecutionMode.Synchronous)
                    {
                            this.CalcularValorTotal(entityContext, preImage);
                    }
                }
            }

            #endregion

            

        }
        public void CalcularValorTotal(Entity entityContext, Entity preImage = null)
        {
            int revisao1 = entityContext.GetAttributeValue<int>("academia_revisao1");
            int revisao2 = entityContext.GetAttributeValue<int>("academia_revisao2");

            entityContext["academia_total"] = revisao1 + revisao2;
        }
    }
}
