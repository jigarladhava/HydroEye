
const axios = require('axios');
const https = require('https');
const { DateTime } = require("luxon");

const username = 'admin';
const password = 'admin@123';

class ph1DataService {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
        this.axiosinstance = axios.create({
            httpsAgent: new https.Agent({
                rejectUnauthorized: false
            })
           /* , proxy: {
                host: '127.0.0.1',
                port: 8888,
            },*/
            ,auth: {
                username: username,
                password: password
            }
        });

    }


    async fetchph1HistoicData(objectName, startTime, endTime) {
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


        /*
http://117.206.154.178:8000/System/FlowTransmitter?datatype=hist&objecttype=FlowTransmitter&objectname=KRL_FT35&starttime=2024-04-04%2012:00:00&endtime=2024-04-05%2008:00:00&archivetype=true&archivetime=5%20Min&archivemath=6&tagnames=Response.Value
        */

        console.log(startTime);
        console.log(endTime);
        if (startTime == undefined || endTime == undefined || startTime == null || endTime == null || startTime.length < 1 || endTime.length < 1) {

            endTime = DateTime.fromObject().toFormat('yyyy-MM-dd%20HH:mm:ss');
            console.log(endTime);
            startTime = DateTime.now().minus({ days: 1 }).startOf('day').toFormat('yyyy-MM-dd%20HH:mm:ss');
            console.log(startTime);
        }

        // console.log(SQLQuery);


        var QueryJson = {
            datatype: 'hist',
            objecttype: objectType,
            objectname: objectName,
            starttime: startTime,
            endtime: endTime,
            archivetype: true,
            archivetime: '5 Min',
            archivemath: 6,
            tagnames: 'Response.Value'
        };


        console.log(`${this.apiBaseUrl}/${objectType}`);
        try {
            const response = await this.axiosinstance.get(`${this.apiBaseUrl}/${objectType}`, { params: QueryJson });

            return response.data.System1[objectType];
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Error fetching data');
        }



    }

    async fetchph1HistoricMLD(objectName, startTime, endTime) {
        let objectType;
        if (objectName.includes('_FT') || objectName.includes('_FTE')) {
            objectType = 'FlowTransmitter';
        }
        else {
            return '{}';
        }


        console.log(startTime);
        console.log(endTime);
        if (startTime == undefined || endTime == undefined || startTime == null || endTime == null || startTime.length < 1 || endTime.length < 1) {

            endTime = DateTime.fromObject().toFormat('yyyy-MM-dd%20HH:mm:ss');
            console.log(endTime);
            startTime = DateTime.now().minus({ days: 1 }).startOf('day').toFormat('yyyy-MM-dd%20HH:mm:ss');
            console.log(startTime);
        }

        // console.log(SQLQuery);


        var QueryJson = {
            datatype: 'hist',
            objecttype: objectType,
            objectname: objectName,
            starttime: startTime,
            endtime: endTime,
            archivetype: true,
            archivetime: '5 Min',
            archivemath: 6,
            tagnames: 'Response.MLD'
        };


        console.log(`${this.apiBaseUrl}/${objectType}`);
        try {
            const response = await this.axiosinstance.get(`${this.apiBaseUrl}/${objectType}`, { params: QueryJson });

            return response.data.System1[objectType];
        } catch (error) {
            console.error('Error fetching data:', error);
            throw new Error('Error fetching data');
        }



    }

}

module.exports = ph1DataService;