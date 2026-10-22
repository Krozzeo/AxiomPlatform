using System;
using System.IO;
using System.Runtime.InteropServices;
using System.Windows.Forms;
namespace Axiom.Native {
 [ComImport, Guid("42f85136-db7e-439c-85f1-e4075d135fc8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface IFileDialog {
  [PreserveSig] int Show(IntPtr owner);
  void SetFileTypes(uint count,IntPtr specs); void SetFileTypeIndex(uint index); void GetFileTypeIndex(out uint index);
  void Advise(IntPtr sink,out uint cookie); void Unadvise(uint cookie); void SetOptions(uint options); void GetOptions(out uint options);
  void SetDefaultFolder(IShellItem item); void SetFolder(IShellItem item); void GetFolder(out IShellItem item); void GetCurrentSelection(out IShellItem item);
  void SetFileName([MarshalAs(UnmanagedType.LPWStr)] string name); void GetFileName(out IntPtr name); void SetTitle([MarshalAs(UnmanagedType.LPWStr)] string title);
  void SetOkButtonLabel([MarshalAs(UnmanagedType.LPWStr)] string label); void SetFileNameLabel([MarshalAs(UnmanagedType.LPWStr)] string label); void GetResult(out IShellItem item);
 }
 [ComImport, Guid("43826d1e-e718-42ee-bc55-a1e261c37bfe"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface IShellItem {
  void BindToHandler(IntPtr bind,ref Guid handler,ref Guid iid,out IntPtr value); void GetParent(out IShellItem item);
  void GetDisplayName(uint kind,out IntPtr name); void GetAttributes(uint mask,out uint attrs); void Compare(IShellItem item,uint hint,out int order);
 }
 [ComImport, Guid("947aab5f-0a5c-4c13-b4d6-4bf7836fc9f8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
 interface IFileOperation {
  void Advise(IntPtr sink,out uint cookie); void Unadvise(uint cookie); void SetOperationFlags(uint flags); void SetProgressMessage([MarshalAs(UnmanagedType.LPWStr)] string text);
  void SetProgressDialog(IntPtr value); void SetProperties(IntPtr value); void SetOwnerWindow(IntPtr value);
  void ApplyPropertiesToItem(IShellItem item); void ApplyPropertiesToItems(IntPtr items);
  void RenameItem(IShellItem item,[MarshalAs(UnmanagedType.LPWStr)] string name,IntPtr sink); void RenameItems(IntPtr items,[MarshalAs(UnmanagedType.LPWStr)] string name);
  void MoveItem(IShellItem item,IShellItem target,[MarshalAs(UnmanagedType.LPWStr)] string name,IntPtr sink); void MoveItems(IntPtr items,IShellItem target);
  void CopyItem(IShellItem item,IShellItem target,[MarshalAs(UnmanagedType.LPWStr)] string name,IntPtr sink); void CopyItems(IntPtr items,IShellItem target);
  void DeleteItem(IShellItem item,IntPtr sink); void DeleteItems(IntPtr items);
  void NewItem(IShellItem target,uint attrs,[MarshalAs(UnmanagedType.LPWStr)] string name,[MarshalAs(UnmanagedType.LPWStr)] string template,IntPtr sink);
  void PerformOperations(); void GetAnyOperationsAborted([MarshalAs(UnmanagedType.Bool)] out bool aborted);
 }
 public static class CommonDialogs {
  [DllImport("shell32.dll",CharSet=CharSet.Unicode,PreserveSig=false)] static extern void SHCreateItemFromParsingName(string path,IntPtr context,ref Guid iid,out IShellItem item);
  static IShellItem Item(string path){Guid iid=typeof(IShellItem).GUID;IShellItem item;SHCreateItemFromParsingName(path,IntPtr.Zero,ref iid,out item);return item;}
  public static string Choose(string mode,string initial,string name) {
   if(mode!="folder"&&mode!="file"&&mode!="save")throw new ArgumentException("Unknown dialog mode");
   var dialog=(IFileDialog)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid(mode=="save"?"C0B4E2F3-BA21-4773-8DBA-335EC946EB8B":"DC1C5A9C-E88A-4DDE-A5A1-60F82A20AEF7")));
   IShellItem start=null,result=null;
   using(var owner=new Form {Text="Axiom",TopMost=true,ShowInTaskbar=false,Width=1,Height=1,StartPosition=FormStartPosition.CenterScreen}) {
    try {
     uint options;dialog.GetOptions(out options);options|=0x40|0x800|0x8;
     if(mode=="folder")options|=0x20;else if(mode=="file")options|=0x1000;else options|=2;
     dialog.SetOptions(options);dialog.SetTitle(mode=="save"?"Save file":mode=="file"?"Open file":"Select folder");
     string folder=File.Exists(initial)?Path.GetDirectoryName(initial):initial;
     if(Directory.Exists(folder)){start=Item(folder);dialog.SetFolder(start);}
     if(mode=="save"&&!String.IsNullOrEmpty(name))dialog.SetFileName(Path.GetFileName(name));
     owner.Show();owner.Activate();owner.BringToFront();int hr=dialog.Show(owner.Handle);
     if(unchecked((uint)hr)==0x800704C7)return null;Marshal.ThrowExceptionForHR(hr);
     dialog.GetResult(out result);IntPtr path;result.GetDisplayName(0x80058000,out path);
     try{return Marshal.PtrToStringUni(path);}finally{Marshal.FreeCoTaskMem(path);}
    } finally {if(result!=null)Marshal.FinalReleaseComObject(result);if(start!=null)Marshal.FinalReleaseComObject(start);Marshal.FinalReleaseComObject(dialog);owner.Close();}
   }
  }
  public static void Recycle(string path) {
   if(Environment.OSVersion.Version.Major<6 || Environment.OSVersion.Version.Major==6&&Environment.OSVersion.Version.Minor<2)throw new NotSupportedException("Recoverable recycling requires Windows 8 or later");
   var operation=(IFileOperation)Activator.CreateInstance(Type.GetTypeFromCLSID(new Guid("3AD05575-8857-4850-9277-11B85BDB8E09")));IShellItem item=null;
   try {operation.SetOperationFlags(0x00080000|0x00100000|0x00000400|0x00000004|0x00000010|0x20000000);item=Item(path);operation.DeleteItem(item,IntPtr.Zero);operation.PerformOperations();bool aborted;operation.GetAnyOperationsAborted(out aborted);if(aborted||Directory.Exists(path)||File.Exists(path))throw new IOException("Recycle operation was not completed; files were retained");}
   finally {if(item!=null)Marshal.FinalReleaseComObject(item);Marshal.FinalReleaseComObject(operation);}
  }
 }
}
