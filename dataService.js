
const axios = require('axios');
const https = require('https');
const { DateTime } = require("luxon");

class DataService {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.axiosinstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
           /* , proxy: {
                host: '127.0.0.1',
                port: 8888,
            }*/
        });

    }


    async fetchHistoicData(dlpNo, fmID, startTime, endTime) {



        console.log(startTime);
        console.log(endTime);
        if (startTime == undefined || endTime == undefined || startTime == null || endTime == null || startTime.length < 1 || endTime.length < 1) {

            endTime = DateTime.fromObject().toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(endTime);
            startTime = DateTime.now().minus({ days: 1 }).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(startTime);
        }
        var SQLConstraint = "\"RecordTime\" BETWEEN {TS '" + startTime + "'} AND {TS '" + endTime + "'}";

        var columnNames = "\"RecordTime\"  as \"timestamp\", \"ValueAsReal\" as \"value\" ";

        var SQLQuery = `SELECT O.FullName as "tagName",` + columnNames + `FROM CDBHISTORIC H INNER JOIN CDBObject O ON H.Id=O.Id WHERE 
            (O.FullName LIKE '` + "%" + dlpNo + "%." + fmID + "I1" + "' OR "
            + "O.FullName LIKE '" + "%" + dlpNo + "%." + fmID + "I2" + "' OR "
            + " O.FullName LIKE '" + "%" + dlpNo + "%." + fmID + "I3" + "' )"
            + " And " + SQLConstraint + ` Order By "RecordTime" ASC`;


        // console.log(SQLQuery);


        var QueryJson = { query: SQLQuery };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(QueryJson.length)
            }
        };

        console.log(`${this.apiBaseUrl}/query`);
        try {
            const response = await this.axiosinstance.post(`${this.apiBaseUrl}/query`, QueryJson, options);
            // console.log(response);
            return response.data.result;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Error fetching data');
        }



    }

    async fetchHistoicRTUData(rtuNo, fmID, startTime, endTime) {



        console.log(startTime);
        console.log(endTime);
        if (startTime == undefined || endTime == undefined || startTime == null || endTime == null || startTime.length < 1 || endTime.length < 1) {

            endTime = DateTime.fromObject().toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(endTime);
            startTime = DateTime.now().minus({ days: 1 }).startOf('day').toFormat('yyyy-MM-dd HH:mm:ss');
            console.log(startTime);
        }
        var SQLConstraint = "\"RecordTime\" BETWEEN {TS '" + startTime + "'} AND {TS '" + endTime + "'}";

        var columnNames = "\"RecordTime\"  as \"timestamp\", \"ValueAsReal\" as \"value\" ";

        var SQLQuery = `SELECT O.FullName as "tagName",` + columnNames + `FROM CDBHISTORIC H INNER JOIN CDBObject O ON H.Id=O.Id WHERE 
            (O.FullName LIKE '` + "RTUs%" + rtuNo + "%" + fmID + "_Instant_Flow" + "' OR "
            + "O.FullName LIKE '" + "RTUs%" + rtuNo + "%" + fmID + "_Todays_Flow" + "' OR "
            + " O.FullName LIKE '" + "RTUs%" + rtuNo + "%" + fmID + "_Totalizer" + "' )"
            + " And " + SQLConstraint + ` Order By "RecordTime" ASC`;


        // console.log(SQLQuery);


        var QueryJson = { query: SQLQuery };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(QueryJson.length)
            }
        };

        console.log(`${this.apiBaseUrl}/query`);
        try {
            const response = await this.axiosinstance.post(`${this.apiBaseUrl}/query`, QueryJson, options);
            
            return response.data.result;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Error fetching data');
        }



    }

    async fetchFMs(rtuNo) {


        var SQLQuery = `SELECT FullName FROM CDBObject O  WHERE (O.FullName LIKE 'RTUs%${rtuNo}%Flow' OR O.FullName LIKE 'RTUs%${rtuNo}%Totalizer') AND TypeName = 'CDNP3AnalogIn'`;


        // console.log(SQLQuery);


        var QueryJson = { query: SQLQuery };

        const options = {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': JSON.stringify(QueryJson.length)
            }
        };

        console.log(`${this.apiBaseUrl}/query`);
        try {
            const response = await this.axiosinstance.post(`${this.apiBaseUrl}/query`, QueryJson, options);
            // console.log(response);
            return response.data.result;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Error fetching data');
        }


    }

}

module.exports = DataService;