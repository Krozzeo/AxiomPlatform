using System;
using System.IO;
using System.Diagnostics;
using System.Reflection;
[assembly: AssemblyTitle("Axiom Hub")]
[assembly: AssemblyDescription("Portable launcher for Start Axiom.cmd")]
[assembly: AssemblyVersion("0.1.8.0")]
internal static class AxiomHub {
 static int Main() {
  try {
   string root=AppDomain.CurrentDomain.BaseDirectory;
   string start=Path.Combine(root,"Start Axiom.cmd");
   if(!File.Exists(start))throw new FileNotFoundException("Extract the whole Axiom delivery. Start Axiom.cmd must be beside Axiom Hub.");
   try{Console.Title="Axiom Hub";}catch{}
   var options=new ProcessStartInfo();
   options.FileName=Environment.GetEnvironmentVariable("ComSpec")??Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.Windows),"System32","cmd.exe");
   options.Arguments="/d /v:off /c \"\"%AXIOM_HUB_START%\"\"";
   options.EnvironmentVariables["AXIOM_HUB_START"]=start;
   options.WorkingDirectory=root;options.UseShellExecute=false;
   using(Process process=Process.Start(options)){process.WaitForExit();return process.ExitCode;}
  } catch(Exception error) {
   Console.Error.WriteLine("Axiom Hub could not start: "+error.Message);
   if(!Console.IsInputRedirected){Console.WriteLine("Press any key to close.");Console.ReadKey(true);}
   return 1;
  }
 }
}
