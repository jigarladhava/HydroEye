
const sql = require('mssql');
const { DateTime } = require('luxon');
const config = {
    user: 'sa',
    password: 'VMC@321',
    server: '10.20.112.25',
    port: 1433,
    database: 'WMS',
    options: {
        encrypt: false,
        trustServerCertificate: true, // Change this based on your connection settings
    },
};



class ph1swmsDataService {



    constructor() {
        // Create a configuration object

    }
    async fetchph1swmsHistoicData(objectName, startTime, endTime) {
        let objectType;
        // console.log('objectName' + objectName);
        if (objectName.includes('_FT') || objectName.includes('_FTE')) {
            objectType = 'FlowTransmitter';
        } else if (objectName.includes('_LT') || objectName.includes('_LTE')) {
            objectType = 'LevelTransmitter';
        } else if (objectName.includes('_PT') || objectName.includes('_PTE')) {
            objectType = 'PressureTransmitter';
        } else if (objectName.includes('_PH')) {
            objectType = 'pHAnalyser';
        } else if (objectName.includes('_CL2')) {
            objectType = 'ChlorineAnalyser';
        } else if (objectName.includes('_TBD')) {
            objectType = 'TurbidityAnalyser';
        } else
            return '{}';


        console.log(startTime);
        console.log(endTime);
        if (startTime == undefined || endTime == undefined || startTime == null || endTime == null || startTime.length < 1 || endTime.length < 1) {

            endTime = DateTime.fromObject().toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(endTime);
            startTime = DateTime.now().minus({ days: 1 }).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(startTime);
        }

        let tagName = objectName
        let param = 'Value';

        // Parse the date strings into Luxon DateTime objects
        let endDate = DateTime.fromFormat(endTime, 'yyyy-MM-dd HH:mm:ss');
        let startDate = DateTime.fromFormat(startTime, 'yyyy-MM-dd HH:mm:ss');

        // Convert the dates to milliseconds
        endTime = endDate.toSeconds();
        startTime = startDate.toSeconds();


        // Query string
        const queryString = `
      SELECT 
      CONCAT(Sensor.Source_SensorID, '.', msdp.SensorDataParam_Name) as tagName, 
        DATEADD(second, Histdata.SCADA_EpochTimeStamp , '19700101 00:00:00') AS timestamp,
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
        AND Histdata.SCADA_EpochTimeStamp BETWEEN ${startTime}  AND ${endTime} ORDER BY 
        Histdata.SCADA_EpochTimeStamp DESC`;

        // console.log(queryString);
        // Execute the query
        const pool = await sql.connect(config);
        const result = await pool.request().query(queryString);
        return result.recordset;
        // Output the result
        //  console.log(result.recordset);

    }

    async fetchph1swmsHistoricMLD(objectName, startTime, endTime) {
        let objectType;
        if (objectName.includes('_FT') || objectName.includes('_FTE')) {
            objectType = 'FlowTransmitter';
        }
        else {
            return '{}';
        }
        let tagName = objectName;

        console.log(startTime);
        console.log(endTime);
        if (startTime == undefined || endTime == undefined || startTime == null || endTime == null || startTime.length < 1 || endTime.length < 1) {

            endTime = DateTime.fromObject().toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(endTime);
            startTime = DateTime.now().minus({ days: 1 }).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(startTime);
            endTime = endTime.toSeconds();
            startTime = startTime.toSeconds() - 1;
        } else {
            let endDate = DateTime.fromFormat(endTime, 'yyyy-MM-dd HH:mm:ss');
            let startDate = DateTime.fromFormat(startTime, 'yyyy-MM-dd HH:mm:ss');

            // Convert the dates to milliseconds
            endTime = endDate.toSeconds();
            startTime = startDate.toSeconds() - 1;

        }
        let param = 'MLD';
        // Convert the dates to milliseconds



        // Query string
        const queryString = `SELECT 
      CONCAT(Sensor.Source_SensorID, '.', msdp.SensorDataParam_Name) as tagName, 
      FORMAT(DATEADD(second, Histdata.SCADA_EpochTimeStamp, '19700101 00:00:00'),'yyyy-MM-dd HH:mm:ss.fff') AS timestamp,
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
        AND Histdata.SCADA_EpochTimeStamp BETWEEN ${startTime}  AND ${endTime} ORDER BY 
        Histdata.SCADA_EpochTimeStamp ASC`;

       // console.log(queryString);
        const pool = await sql.connect(config);
        const result = await pool.request().query(queryString);

        //console.log(result.recordset);
        return result.recordset;





    }

}

module.exports = ph1swmsDataService;