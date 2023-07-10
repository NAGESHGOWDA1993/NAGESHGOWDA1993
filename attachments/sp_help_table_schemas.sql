/* We create the procedures in the master database so that they are
   available from all user databases */
USE MASTER
GO

/* Drop old version */
IF EXISTS ( SELECT 'x' FROM sys.procedures WHERE name = 'sp_help_table_schemas')
	DROP PROCEDURE dbo.sp_help_table_schemas
GO 

CREATE PROCEDURE dbo.sp_help_table_schemas(@ObjectName as sysname) as
BEGIN

	/*
		sp_help_table_schemas - replacement for sp_help but with support
		for schemas other than dbo.
		
		Initial Version:- David Betteridge,  11th Jan 2012
		david.betteridge@proactis.com
	
	*/
	
	SET NOCOUNT ON
	
	-- Declare local variables
	DECLARE @NumberOfMatchingTables AS INTEGER
	DECLARE @cmd VARCHAR(300) ;
	
	/* First we need to determine the schema to which our table belongs.    It's possible of course
	   that the same table may belong to multiple schemas.
	   
	   For example
			Sales.Users
			Dev.Users
	*/				
	CREATE TABLE #schemas ( SchemaName SYSNAME NOT NULL)
	
	
	/* As this procedure sits in the master database we need to ensure that we query the system
	   tables in the user database.  There are two possible ways of doing this.
	
	   We can use dymanic SQL or we can mark this procedure as a system object by using the
	   sp_ms_marksystemobject command.
	*/
	

	-- The dynamic sql is shown below.		 
	--EXECUTE sp_executesql N'insert into #schemas 
	--					  		 select s.Name
	--							   from sys.tables t
	--							   join sys.schemas s on t.schema_id = s.schema_id
	--							  where t.name = @pObjectName',
	--							      N'@pObjectName sysname',
	--								  @pObjectName = @ObjectName;


	-- The non-dynamic version
	INSERT INTO #schemas 
  		 SELECT s.Name
		   FROM sys.tables t
		   JOIN sys.schemas s ON t.schema_id = s.schema_id
		  WHERE t.name = @ObjectName

	/* We can still use @@ROWCOUNT with either approach*/
	/* (Thanks to Martin Bell for this idea) */
	SET @NumberOfMatchingTables = @@ROWCOUNT 	 
	 
	 
	 
	 /* The table does not appear to exist */
	 IF @NumberOfMatchingTables = 0  
	 BEGIN
		RAISERROR('Could not find a table called %s.',16,1, @ObjectName)
		RETURN
	 END

	 
	 
	 /* This table has a single owner so its straight forward */
	 IF @NumberOfMatchingTables = 1
	 BEGIN
		 DECLARE @SchemaName AS SYSNAME 
		 SELECT @SchemaName = SchemaName FROM #schemas
		
		 SET @cmd = 'EXEC sp_help ''' + QUOTENAME(@SchemaName) + '.' + QUOTENAME(@ObjectName) + ''' ;' ;		
		 EXEC ( @cmd )
		 
		 RETURN
	 END
	 
	 
	 
	 /* We have multiple tables, with different owners */
	 IF @NumberOfMatchingTables > 1  
	 BEGIN
		  -- Use a cursor to display each of the matches
          DECLARE tbl_cursor CURSOR FOR 
          SELECT 'EXEC sp_help ''' + QUOTENAME(SchemaName) + '.' + QUOTENAME(@ObjectName) + ''' ;'
          FROM #schemas ;

          OPEN tbl_cursor;

          FETCH NEXT FROM tbl_cursor INTO @cmd ;
          WHILE @@FETCH_STATUS = 0
          BEGIN
              PRINT @cmd
              EXEC ( @cmd ) ;
              FETCH NEXT FROM tbl_cursor INTO @cmd ;
          END ;
          CLOSE tbl_Cursor ;
          DEALLOCATE tbl_Cursor ;
          
          RETURN
	 END


END 
GO

EXEC sp_ms_marksystemobject 'sp_help_table_schemas'
GO