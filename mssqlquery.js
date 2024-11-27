const sql = require('mssql');
const { DateTime } = require('luxon');

// Create a configuration object
const config = {
    user: 'sa',
    password: 'VMC@321',
    server: '10.20.112.25',
    database: 'WMS',
    options: {
        encrypt: false,
        trustServerCertificate: true, // Change this based on your connection settings
    },
};

async function executeQuery() {
    try {
        // Create a new instance of the connection pool
        const pool = await sql.connect(config);

        /*objectname: objectName,
        starttime: startTime,
        endtime: endTime,*/

        let tagName = 'KRL_FT35'
        let param = 'Value';
        let endtime = '2024-04-07 00:00:00';
        let starttime = '2024-04-06 00:00:00';

        // Parse the date strings into Luxon DateTime objects
        let endDate = DateTime.fromFormat(endtime, 'yyyy-MM-dd HH:mm:ss');
        let startDate = DateTime.fromFormat(starttime, 'yyyy-MM-dd HH:mm:ss');

        // Convert the dates to milliseconds
        endtime = endDate.toSeconds();
        starttime = startDate.toSeconds();


        // Query string
        const queryString = `
      SELECT 
      CONCAT(Sensor.Source_SensorID, '.', msdp.SensorDataParam_Name) as tagname, 
        DATEADD(second, Histdata.SCADA_EpochTimeStamp + 1, '19700101 00:00:00') AS timestamp,
        Histdata.SensorData_Value as value
      FROM 
        T_SensorData_Details Histdata, 
        M_Sensor Sensor, 
        M_SensorData_Parameter msdp  
      WHERE 
        Histdata.Sensor_TblRefID = Sensor.Sensor_TblRefID  
        AND Histdata.SensorDataParam_TblRefID = msdp.SensorDataParam_TblRefID 
        AND Sensor.Source_SensorID LIKE '${tagName}'
        AND msdp.SensorDataParam_Name LIKE '${param}'
        AND Histdata.SCADA_EpochTimeStamp BETWEEN ${starttime}  AND ${endtime} ORDER BY 
        Histdata.SCADA_EpochTimeStamp DESC`;

        console.log(queryString);
        // Execute the query
        // const result = await pool.request().query(queryString);

        // Output the result
        //  console.log(result.recordset);

    } catch (err) {
        console.error('SQL error', err);
    }
}

// Call the function to execute the query
executeQuery();
