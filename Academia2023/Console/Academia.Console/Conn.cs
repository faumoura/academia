using Microsoft.Xrm.Sdk;
using Microsoft.Xrm.Tooling.Connector;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Text;
using System.Threading.Tasks;

namespace Academia.Console
{
    class Conn
    {
        public static IOrganizationService GerarService(string connectionString)
        {
            if (string.IsNullOrEmpty(connectionString))
                throw new Exception(string.Format("Parametro {0} não pode ser nulo ou vazio.", nameof(connectionString)));
            try
            {
                ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;
                CrmServiceClient crmService = new CrmServiceClient(connectionString);

                return crmService;
            }
            catch (Exception e)
            {
                throw new Exception(e.Message);
            }
        }

        internal static IOrganizationService GerarService(object p)
        {
            throw new NotImplementedException();
        }
    }
}
