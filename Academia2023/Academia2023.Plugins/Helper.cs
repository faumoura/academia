using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Academia2023.Plugins
{
    public static class Helper
    {

        public enum Message
        {
            update, create, delete, assing, setstate, setstatedynamicentity
        }
        public enum EventStage
        {
            PreValidation = 10, PreOperation = 20, PostOperation = 40,
        }
        public enum ExecutionMode
        {
            Synchronous = 0, Asynchronous = 1,
        }
    }


}
