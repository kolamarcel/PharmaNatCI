 select table_name from user_tables;
 select * from regions;
 select * from locations;
 select * from departments;
 select * from jobs;
 select department_id,location_id from departments;
  SELECT job_id,LOWER(job_id),INITCAP(job_id),job_title,UPPER(job_title) FROM jobs;
  describe DUAL;
  select dummy From dual;
  select user from dual;
  select sysdate from dual;
  select 2 + 2 AS Total from dual;
  select LENGTH('HelloWorld!!!') AS LENGTH from dual;
  select job_title,SUBSTR(job_title,1,10),SUBSTR(job_title,11) from jobs;
  select job_title,INSTR(job_title,'Sales') AS Sales_Occur from jobs order by Sales_Occur DESC;
  select table_name from user_tables;
  select CONCAT(first_name,last_name) AS FullName from employees;
  select last_name || ',' || first_name from employees;
  SELECT 314.43235 ,ROUND(314.43235,2),ROUND(314.43235,0),TRUNC(314.43235) FROM dual;
  SELECT 314.43235 ,ROUND(314.43235,2),ROUND(314.53235,0),TRUNC(314.43235) FROM dual;
  select employee_id,first_name,last_name,salary AS Yearly, ROUND((salary/12),2) AS Monthly from employees;7
  