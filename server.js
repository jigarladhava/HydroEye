const express = require('express');
const app = express();
const port = 9090; // or any other port you prefer
const path = require('path');
const { DateTime } = require('luxon');
const moment = require('moment');
const basicAuth = require('basic-auth-connect'); // Import basic-auth-connect middleware
const https = require('https');
const axios = require('axios');
const bodyParser = require('body-parser');
fs = require('fs');
const bcrypt = require('bcrypt');
const exphbs = require('express-handlebars');



const passport = require('passport');/* New code for login Module*/
require('./config/passport')(passport); /* New code for login Module*/
const auth = require('./middleware/auth'); /* New code for login Module*/
const { sequelize, User } = require('./models/database'); /* New code for login Module*/

auth(app);

const axiosinstance = axios.create({
  httpsAgent: new https.Agent({
    rejectUnauthorized: false
  })
  /*, proxy: {
    host: '127.0.0.1',
    port: 8888,
  }*/
});


// Assuming you have APIs to fetch data
const DataService = require('./dataService');
const ph1DataService = require('./ph1dataService');
const ph1swmsDataService = require('./ph1swmsdataService');
const { readLocationsFromFile, readTagsFromFile, readTagsFromPCTFile } = require('./dataReader');


const baseUrl = 'http://10.20.122.102:3000';
//const baseUrl = 'http://26.143.133.204:3000';
const ph1baseUrl = 'http://117.206.154.178:8000/System';



const dataService = new DataService(baseUrl);
const ph1dataservice = new ph1DataService(ph1baseUrl);
const ph1swmsdataService = new ph1swmsDataService();

app.use(bodyParser.json());
//app.use(basicAuth('user', 'blank'));

/* New code for login Module*/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
//app.use(session({ secret: 'auth_model_secret', resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());

app.engine('hbs', exphbs.engine({ extname: '.hbs' }));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

/*
const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};*/


app.use((req, res, next) => {
  const unprotectedRoutes = ['/login', '/signup', '/logout']; // Add routes that don't require authentication
  if (unprotectedRoutes.includes(req.path)) {
    return next(); // Skip authentication check for these routes
  }
  ensureAuthenticated(req, res, next); // Apply authentication middleware to other routes
});

// Authentication middleware
function ensureAuthenticated(req, res, next) {
  if (req.user !== undefined && req.user.username !== undefined) {
    if (req.user.isActive) {
      // console.log( 'isActive' , req.user.isActive);
      return next(); // Allow access if authenticated
    } else res.redirect('/login?error=Account not activated');
    return;

  }
  res.redirect('/login'); // Redirect to login if not authenticated
}

app.get('/admin/*', ensureAdmin);

function ensureAdmin(req, res, next) {
  // console.log(req.user.isAdmin);
  if (req.isAuthenticated() && req.user.username !== undefined && req.user.isAdmin) {
    return next();
  }
  res.status(403).send('Access Denied: Admins only');
}





app.get('/', (req, res) => {
  if (req.user === undefined || req.user.username === undefined) {
    res.redirect('/login'); // Redirect to login if not authenticated
  } else {
    res.redirect('/dashboard'); // Redirect to dashboard if authenticated
  }
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', ensureAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id', 'username', 'isAdmin','isActive'] });
    //console.log(users);
    const plainUsers = users.map(user => user.get({ plain: true })); // Convert to plain objects
    res.render('admin', { users: plainUsers });

  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).send('Server Error');
  }
});

app.post('/api/update-user-flags', ensureAdmin, async (req, res) => {
  const { userId, isAdmin, isActive } = req.body;

  try {
    // Find the user by ID
    const user = await User.findByPk(userId); // Replace with your ORM or database logic
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update the flags
    if (isAdmin !== undefined) user.isAdmin = isAdmin;
    if (isActive !== undefined) user.isActive = isActive;

    // Save the changes
    await user.save();

    // Respond with success
    res.json({ success: true, message: 'User flags updated successfully', user });
  } catch (error) {
    console.error('Error updating user flags:', error);
    res.status(500).json({ success: false, message: 'Error updating user flags' });
  }
});



app.post('/admin/add-user', ensureAdmin, async (req, res) => {
  const { username, password, isAdmin } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword, isAdmin });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error adding user');
  }
});

app.post('/admin/change-password', ensureAdmin, async (req, res) => {
  const { userId, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { id: userId } });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error updating password');
  }
});

app.post('/admin/change-password', ensureAdmin, async (req, res) => {
  const { userId, newPassword } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update({ password: hashedPassword }, { where: { id: userId } });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error updating password');
  }
});

app.post('/admin/delete-user', ensureAdmin, async (req, res) => {
  const { userId } = req.body;
  try {
    await User.destroy({ where: { id: userId } });
    res.redirect('/admin');
  } catch (error) {
    res.status(500).send('Error deleting user');
  }
});


app.get('/data', async (req, res) => {
  const { dlp, flowmeter, startTime, endTime } = req.query;
  const isAdmin = req.user.isAdmin;
    try {

    const historicalData = await dataService.fetchHistoicData(dlp, flowmeter, startTime, endTime,isAdmin);

    if (historicalData.length == 0) {
      res.status(500).json({ error: 'No data found for search' });
      return;
    }




    for (let i = 0; i < historicalData.length; i++) {
      historicalData[i].timestamp = DateTime.fromFormat(historicalData[i].timestamp.replace(/\.\d+$/g, ''), 'dd/MM/yyyy HH:mm:ss').toFormat('yyyy-MM-dd  HH:mm:ss');
    }





    const lastDayTotals = {};

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = yesterday.toISOString().split('T')[0]; // Get the date part


    for (let i = 1; i <= 3; i++) {
      const filteredData = historicalData.filter(record => {
        return record.tagName.includes('I' + i) && record.timestamp.includes(yesterdayTimestamp);
      });

      filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      const lastReading = filteredData.length > 0 ? filteredData[0].value : 'No data for yesterday';

      switch (i) {
        case 1:
          lastDayTotals.lastReading = lastReading;
          break;
        case 2:
          lastDayTotals.daysTotal = lastReading;
          break;
        case 3:
          lastDayTotals.lifeTotal = lastReading;
          break;
        default:
          break;
      }

    }
    const todayTotals = {};



    // Get today's date
    const today = new Date();
    const todayTimestamp = today.toISOString().split('T')[0]; // Get the date part
    console.log(historicalData[0].tagName + todayTimestamp + ":" + historicalData[0].timestamp);
    // Filter the data for today's date and each AI type
    for (let i = 1; i <= 3; i++) {


      const filteredData = historicalData.filter(record => {
        return record.tagName.includes('I' + i) && record.timestamp.includes(todayTimestamp);
      });

      // console.log(filteredData);

      // Sort the filtered data by timestamp in descending order
      filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Get the last reading value if there's any data for today
      const lastReading = filteredData.length > 0 ? filteredData[0].value : 'No data for today';

      // Map the value based on AI type
      switch (i) {
        case 1:
          todayTotals.lastReading = lastReading;
          break;
        case 2:
          todayTotals.daysTotal = lastReading;
          break;
        case 3:
          todayTotals.lifeTotal = lastReading;
          break;
        default:
          break;
      }
    }





    res.json({
      data: historicalData,
      lastdaylastReading: lastDayTotals.lastReading,
      lastdaysTotal: lastDayTotals.daysTotal,
      lastlifeTotal: lastDayTotals.lifeTotal,
      todaylastReading: todayTotals.lastReading,
      todaysTotal: todayTotals.daysTotal,
      todayslifeTotal: todayTotals.lifeTotal

    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});


app.get('/data/rtu', async (req, res) => {
  const { rtuNo, flowmeter, startTime, endTime } = req.query;

  try {
    const isAdmin = req.user.isAdmin;
    const historicalData = await dataService.fetchHistoicRTUData(rtuNo, flowmeter, startTime, endTime,isAdmin);
    //  let latestRecords = {};
    if (historicalData.length == 0) {
      res.status(500).json({ error: 'No data found for search' });
      return;
    }
    //  console.log(historicalData);
    // Iterate through the data




    for (let i = 0; i < historicalData.length; i++) {
      //  console.log(historicalData[i]);
      historicalData[i].timestamp = DateTime.fromFormat(historicalData[i].timestamp.replace(/\.\d+$/g, ''), 'dd/MM/yyyy HH:mm:ss').toFormat('yyyy-MM-dd  HH:mm:ss');
    }





    //  console.log(historicalData);

    const lastDayTotals = {};

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayTimestamp = yesterday.toISOString().split('T')[0]; // Get the date part

    // Filter the data for the specified AI type and yesterday's date

    /* "_" 
     + "_" 
        "_" */
    let datasetArray = ["Instant_Flow", "Todays_Flow", "Totalizer"];

    for (let i = 1; i <= 3; i++) {
      const filteredData = historicalData.filter(record => {
        return record.tagName.includes(datasetArray[i - 1]) && record.timestamp.includes(yesterdayTimestamp);
      });

      // Sort the filtered data by timestamp in descending order
      filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Get the last reading value if there's any data for yesterday
      const lastReading = filteredData.length > 0 ? filteredData[0].value : 'No data for yesterday';

      switch (datasetArray[i - 1]) {
        case datasetArray[0]:
          lastDayTotals.lastReading = lastReading;
          break;
        case datasetArray[1]:
          lastDayTotals.daysTotal = lastReading;
          break;
        case datasetArray[2]:
          lastDayTotals.lifeTotal = lastReading;
          break;
        default:
          break;
      }

    }
    const todayTotals = {};



    // Get today's date
    const today = new Date();
    const todayTimestamp = today.toISOString().split('T')[0]; // Get the date part
    console.log(historicalData[0].tagName + todayTimestamp + ":" + historicalData[0].timestamp);
    // Filter the data for today's date and each AI type
    for (let i = 1; i <= 3; i++) {


      const filteredData = historicalData.filter(record => {
        return record.tagName.includes(datasetArray[i - 1]) && record.timestamp.includes(todayTimestamp);
      });

      // console.log(filteredData);

      // Sort the filtered data by timestamp in descending order
      filteredData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Get the last reading value if there's any data for today
      const lastReading = filteredData.length > 0 ? filteredData[0].value : 'No data for today';

      // Map the value based on AI type
      switch (datasetArray[i - 1]) {
        case datasetArray[0]:
          todayTotals.lastReading = lastReading;
          break;
        case datasetArray[1]:
          todayTotals.daysTotal = lastReading;
          break;
        case datasetArray[2]:
          todayTotals.lifeTotal = lastReading;
          break;
        default:
          break;
      }
    }





    res.json({
      data: historicalData,
      lastdaylastReading: lastDayTotals.lastReading,
      lastdaysTotal: lastDayTotals.daysTotal,
      lastlifeTotal: lastDayTotals.lifeTotal,
      todaylastReading: todayTotals.lastReading,
      todaysTotal: todayTotals.daysTotal,
      todayslifeTotal: todayTotals.lifeTotal

    });
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

app.get('/ph2/getFMs', async (req, res) => {

  const { rtuNo } = req.query;

  try {
    const isAdmin = req.user.isAdmin;
    const fmDetails = await dataService.fetchFMs(rtuNo,isAdmin);
    res.json(fmDetails);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Error fetching data' });
  }



});

app.get('/ph1/locations', async (req, res) => {
  const locations = await readLocationsFromFile();
  res.json(locations);
});

app.get('/ph1/tags/:location', async (req, res) => {
  const { location } = req.params;
  const tags = await readTagsFromFile(location);
  res.json(tags);
});

app.get('/ph1/pcttags/:location', async (req, res) => {
  const { location } = req.params;
  const tags = await readTagsFromPCTFile(location);
  res.json(tags);
});


app.get('/ph1/swms/data', async (req, res) => {
  const { objectname, startTime, endTime } = req.query;
  console.log(req.query);
  const tags = await ph1swmsdataService.fetchph1swmsHistoicData(objectname, startTime, endTime);
  const transformedData = tags.map(item => {
    return {
      tagName: item.tagName,
      timestamp: DateTime.fromJSDate(item.timestamp).toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
      value: parseFloat(item.value) // Assuming the "Value" property is a string representing a numeric value
    };
  });
  res.json(transformedData);


});



app.get('/ph1/data', async (req, res) => {
  const { objectname, startTime, endTime } = req.query;
  console.log(req.query);
  try {
    const tags = await ph1dataservice.fetchph1HistoicData(objectname, startTime, endTime);
    const transformedData = tags.map(item => {
      return {
        tagName: item.TagName,
        timestamp: item.TimeStamp,
        value: parseFloat(item.Value) // Assuming the "Value" property is a string representing a numeric value
      };
    });
    res.json(transformedData);
  }
  catch (error) {
    console.error('Error fetching data:', error);
    res.json(null);
  }
});


app.get('/ph1/swms/MLDdata', async (req, res) => {
  const { objectname, startTime, endTime } = req.query;
  console.log(req.query);
  const tags = await ph1swmsdataService.fetchph1swmsHistoricMLD(objectname, startTime, endTime);
  let transformedData = tags.map(item => {
    return {
      tagName: item.tagName,
      // timestamp: DateTime.fromJSDate(item.timestamp).toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
      timestamp: moment(item.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS').add(1, 'seconds').startOf('day').toISOString(),


      value: parseFloat(item.value) // Assuming the "Value" property is a string representing a numeric value
    };
  });

  transformedData = transformedData.filter(currentdata => currentdata.value > 0 && currentdata.value < 300);
  /*
    const groupedData = transformedData.reduce((acc, item) => {
      const date = item.timestamp.split(' ')[0]; // Extract date part
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(item);
      return acc;
    }, {});*/





  res.json(transformedData);
});






app.get('/ph1/MLDdata', async (req, res) => {
  const { objectname, startTime, endTime } = req.query;
  console.log(req.query);
  try {
    const tags = await ph1dataservice.fetchph1HistoricMLD(objectname, startTime, endTime);
    let transformedData = tags.map(item => {
      return {
        tagName: item.TagName,
        timestamp: moment(item.TimeStamp, 'YYYY-MM-DD HH:mm:ss.SSS').add(1, 'seconds').startOf('day').toISOString(),
        //  /   timestamp: moment(item.TimeStamp, 'YYYY-MM-DD HH:mm:ss.SSS').add(1, 'seconds'),
        value: parseFloat(item.Value) // Assuming the "Value" property is a string representing a numeric value
      };
    });

    transformedData = transformedData.filter(currentdata => currentdata.value > 0 && currentdata.value < 300);
    /*
      const groupedData = transformedData.reduce((acc, item) => {
        const date = item.timestamp.split(' ')[0]; // Extract date part
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(item);
        return acc;
      }, {});*/





    res.json(transformedData);
  }
  catch (error) {
    console.error('Error fetching data:', error);
    res.json(null);
  }
});



app.post('/bulkDLP/query', async (req, res) => {
  const { dlpNo, fmID, startTime, endTime } = req.body;
  /*    const startTime = '2024-06-01 00:00:00'; // Example start time
      const endTime = '2024-07-02 00:00:00'; // Example end time*/



  const SQLConstraint = `"RecordTime" BETWEEN {TS '${startTime}'} AND {TS '${endTime}'}`;
  const columnNames = `"RecordTime" as "timestamp", "ValueAsReal" as "value"`;
  const SQLQuery = `SELECT O.FullName as "tagName", ${columnNames}
                      FROM CDBHISTORIC H
                      INNER JOIN CDBObject O ON H.Id=O.Id
                      WHERE (O.FullName LIKE '%${dlpNo}%${fmID}I1' OR O.FullName LIKE '%${dlpNo}%${fmID}I2' OR O.FullName LIKE '%${dlpNo}%${fmID}I3')
                      AND ${SQLConstraint}
                      ORDER BY "RecordTime" ASC`;

  try {
    const response = await axiosinstance.post(`${baseUrl}/query`, { query: SQLQuery });
    const result = response.data.result;

    for (let i = 0; i < result.length; i++) {
      //  console.log(historicalData[i]);
      result[i].timestamp = DateTime.fromFormat(result[i].timestamp.replace(/\.\d+$/g, ''), 'dd/MM/yyyy HH:mm:ss').toFormat('yyyy-MM-dd  HH:mm:ss');
    }




    res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
});


app.post('/bulkDLP/submit', async (req, res) => {
  const { dlpNo, fmID, status, remarks } = req.body;
  const log = `${dlpNo}-${fmID}\t${status}\t${remarks}\n`;

  fs.appendFile('public/private/responses.txt', log, (err) => {
    if (err) {
      console.error('Error saving response:', err);
      res.status(500).send('Error saving response');
    } else {
      res.send('Response saved');
    }
  });
});


app.post('/bulkDLP/remove', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'private', 'responses.txt');

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error Deleting', err);
      res.status(500).send('Error Deleting');
    } else {
      res.send('File Deleted');
    }
  });
});


app.post('/bulkRTU/query', async (req, res) => {
  const { dlpNo, fmID, startTime, endTime } = req.body;
  /*    const startTime = '2024-06-01 00:00:00'; // Example start time
      const endTime = '2024-07-02 00:00:00'; // Example end time*/



  var SQLConstraint = "\"RecordTime\" BETWEEN {TS '" + startTime + "'} AND {TS '" + endTime + "'}";

  var columnNames = "\"RecordTime\"  as \"timestamp\", \"ValueAsReal\" as \"value\" ";

  var SQLQuery = `SELECT O.FullName as "tagName",` + columnNames + `FROM CDBHISTORIC H INNER JOIN CDBObject O ON H.Id=O.Id WHERE 
            (O.FullName LIKE '` + "RTUs%" + dlpNo + "%" + fmID + "_Instant_Flow" + "' OR "
    + "O.FullName LIKE '" + "RTUs%" + dlpNo + "%" + fmID + "_Todays_Flow" + "' OR "
    + " O.FullName LIKE '" + "RTUs%" + dlpNo + "%" + fmID + "_Totalizer" + "' )"
    + " And " + SQLConstraint + ` Order By "RecordTime" ASC`;


  try {
    const response = await axiosinstance.post(`${baseUrl}/query`, { query: SQLQuery });
    const result = response.data.result;

    for (let i = 0; i < result.length; i++) {
      //  console.log(historicalData[i]);
      result[i].timestamp = DateTime.fromFormat(result[i].timestamp.replace(/\.\d+$/g, ''), 'dd/MM/yyyy HH:mm:ss').toFormat('yyyy-MM-dd  HH:mm:ss');
    }

    res.json(result);
  } catch (error) {
    console.error('Error executing query:', error);
    res.status(500).send('Error executing query');
  }
});


app.post('/bulkRTU/submit', async (req, res) => {
  const { dlpNo, fmID, status, remarks } = req.body;
  const log = `${dlpNo}-${fmID}\t${status}\t${remarks}\n`;

  fs.appendFile('public/private/responsesRTU.txt', log, (err) => {
    if (err) {
      console.error('Error saving response:', err);
      res.status(500).send('Error saving response');
    } else {
      res.send('Response saved');
    }
  });
});


app.post('/bulkRTU/remove', async (req, res) => {
  const filePath = path.join(__dirname, 'public', 'private', 'responsesRTU.txt');

  fs.unlink(filePath, (err) => {
    if (err) {
      console.error('Error Deleting', err);
      res.status(500).send('Error Deleting');
    } else {
      res.send('File Deleted');
    }
  });
});


app.get('/login', (req, res) => {

  if (req.user !== undefined && req.user.username !== undefined) {
    res.redirect('/dashboard');
  }
  else {
    const error = req.query.error || '';

    // Path to the login.html file
    const loginPagePath = path.join(__dirname, 'public', 'login.html');

    // Read the login.html file
    fs.readFile(loginPagePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error reading login.html:', err);
        return res.status(500).send('Server Error');
      }

      // Inject error message dynamically into the HTML
      const modifiedData = data.replace(
        '{{errorMessage}}',
        error ? `<p style="color: red;">${escapeHTML(error)}</p>` : ''
      );

      res.send(modifiedData);

    });
  }
});

const escapeHTML = (str) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};


/*
app.get('/', (req, res) => {
  res.send('Welcome to the Home Page!');
});*/


app.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/login?error=Invalid username or password or account not activated',
  })
);

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ username, password: hashedPassword });
    res.redirect('/login');
  } catch (err) {
    // console.log(err);
    res.status(500).send('Error signing up.');
  }
});

app.get('/dashboard', (req, res) => {
  // console.log(req.user);
  //console.log('User:', req.user); // Should display the logged-in user
  //console.log('Authenticated:', req.isAuthenticated()); // Should return `true` only for logged-in users

  if (req.user.username !== undefined) {
    // Send the index.html file

    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.redirect('/login'); // Redirect to login if not authenticated
  }
});


app.get('/dashboard/user', (req, res) => {
  if (req.user.username !== undefined) {
    // console.log(req.user);
    res.json({ username: req.user.username }); // Send the username to the client
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
});


app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect('/login');
  });
});




app.listen(port, () => {
  // console.log(`Server running at http://localhost:${port}`);
  try {
    sequelize.authenticate(); // Verify DB connection on startup
    console.log('Database connection verified.');
    console.log(`Server running on http://localhost:${port}`);
  } catch (error) {
    console.error('Database connection failed:', error);
  }


});
