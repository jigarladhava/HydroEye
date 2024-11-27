const { DateTime } = require('luxon');
const  moment  = require('moment');

let TimeStamp = '2024-03-14 23:59:59.760';
TimeStamp = DateTime.fromFormat(TimeStamp,  'yyyy-MM-dd HH:mm:ss.SSS').toFormat('yyyy-MM-dd HH:mm:ss');
console.log(TimeStamp);
//console.log(moment(TimeStamp, 'YYYY-MM-DD HH:mm:ss.SSS').format('YYYY-MM-DD HH:mm:ss'));