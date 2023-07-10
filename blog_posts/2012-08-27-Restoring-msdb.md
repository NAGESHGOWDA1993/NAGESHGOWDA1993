START_META
DATE: 2012-08-27
TITLE: Pitfuls of restoring a MSDB database
END_META

We recently performed a disaster recovery exercise which included the restoration of the MSDB database onto our DR server.  I did a quick google to see if there were any special considerations and found the following MS article.  Considerations for Restoring the model and msdb Databases (http://msdn.microsoft.com/en-us/library/ms190749(v=sql.105).aspx).   It said both the original and replacement servers must be on the same version,  I double-checked and in my case they are both __SQL Server 2008 R2 SP1 (10.50.2500)__.

So I went ahead and stopped __SQL Server agent__, restored the database and restarted the agent.  Checked the jobs and they were all there, everything looked great, and was until the server was rebooted a few days later.
Then the __syspolicy_purge_history__ job started failing on the 3rd step with the error message
_“Unable to start execution of step 3 (reason: The PowerShell subsystem failed to load [see the SQLAGENT.OUT file for details]; The job has been suspended). The step failed.”_
 
A bit more googling pointed me to the __msdb.dbo.syssubsystems__ table

```sql
SELECT * FROM msdb.dbo.syssubsystems WHERE start_entry_point ='PowerShellStart'
```
 
And in particular the value for the __subsystem_dll__. It still had the path to the __SQLPOWERSHELLSS.DLL__ but on the old server. The DR instance has a different name to the live instance and so the paths are different.
 
This was quickly fixed with the following SQL
```sql
Use msdb;
GO
sp_configure 'allow updates', 1 ;
RECONFIGURE WITH OVERRIDE ;
GO
UPDATE msdb.dbo.syssubsystems SET subsystem_dll='C:\Program Files\Microsoft SQL Server\MSSQL10_50.DR\MSSQL\binn\SQLPOWERSHELLSS.DLL' WHERE start_entry_point ='PowerShellStart';
GO
sp_configure 'allow updates', 0;
RECONFIGURE WITH OVERRIDE ;
GO
```

I stopped and started SQL Server agent and the job now completes.
 

I then wondered if anything else might be broken,
```sql
SELECT subsystem_dll FROM msdb.dbo.syssubsystems
```
Shows a further 10 wrong paths – fortunately for parts of SQL (replication, SSIS etc) we aren’t using!


Lessons Learnt
1. DR exercises are a good thing!
2. Keep the Live and DR environments as similar as possible.

Ported from https://sqlblogcasts.com/blogs/david-betteridge/archive/2012/08/27/restoring-msdb.aspx