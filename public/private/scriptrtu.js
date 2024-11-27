document.addEventListener('DOMContentLoaded', function () {

  // Clear existing options


  const Rtusearchbutton = document.getElementById('fetchFMs');
  const flowmeterDropdown = document.getElementById('flowmeter'); // Get the select element

  flowmeterDropdown.innerHTML = '';

  Rtusearchbutton.addEventListener('click', async (event) => {
    event.preventDefault();

    const dlp = document.getElementById('dlp').value;

    document.getElementById('loadingIcon').style.display = 'block';
    const responseFMs = await fetch(`/ph2/getFMs?rtuNo=${dlp}`); // Fetch data from /ph2/getFMs
    let FMsData = await responseFMs.json(); // Parse response as JSON

    let result = FMsData.map(obj => {
      const parts = obj.FullName.split('.').pop().split('_'); // Split the FullName string by "." and then by "_"
      const firstPart = parts[0]; // Get the first part after splitting by "_"
      return firstPart;
    });

    FMsData = [...new Set(result)];


    // Clear existing options
    flowmeterDropdown.innerHTML = '';

    // Populate select element with new options
    FMsData.forEach(fm => {
      const option = document.createElement('option');
      option.value = fm; // Assuming fm contains the Flowmeter ID
      option.textContent = fm; // Set option text as Flowmeter ID
      flowmeterDropdown.appendChild(option); // Append option to select element
    });
    document.getElementById('loadingIcon').style.display = 'none';
  });



  const form = document.getElementById('dataForm');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    const dlp = document.getElementById('dlp').value;
    const flowmeter = document.getElementById('flowmeter').value;
    const startTime = $("#startTimePicker").find("input").val();
    const endTime = $("#endTimePicker").find("input").val();




    document.getElementById('loadingIcon').style.display = 'block';

    const zoomOptions = {

      xAxis: { type: 'datetime' },
      chart: {
        zoomType: 'x', // Enable default zooming (optional)
      },
      plotOptions: {
        series: {
          allowPointSelect: true, // Enable point selection (optional)
        }
      }
    };

    // Enable touch zooming for all charts
    Highcharts.setOptions({
      chart: {
        pinchType: 'x' // Enable pinch zooming on the x-axis
      }
    });




    try {
      const response = await fetch(`/data/rtu/?rtuNo=${dlp}&flowmeter=${flowmeter}&startTime=${startTime}&endTime=${endTime}`);
      const data = await response.json();

      // Load data into Highcharts graph
      // Example: Assuming data is an array of objects with timestamps and values
      Highcharts.chart('chartContainer1', {
        ...zoomOptions,
        title: { text: 'Flow rate (m3/hr)' },
        series: [{
          name: data.data[0].tagName,
          data: data.data.filter(item => item.tagName.endsWith('Instant_Flow'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
        }]
      });

      Highcharts.chart('chartContainer2', {
        ...zoomOptions,
        title: { text: 'Today\' Flow (m3)' },
        series: [{
          name: data.data[0].tagName,
          data: data.data.filter(item => item.tagName.endsWith('Todays_Flow'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
        }]
      });

      Highcharts.chart('chartContainer3', {
        ...zoomOptions,
        title: { text: 'Lifetime\' Total (m3)' },
        series: [{
          name: data.data[0].tagName,
          data: data.data.filter(item => item.tagName.endsWith('Totalizer'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
        }]
      });


      document.getElementById('tagNumber').innerText = data.data[0].tagName.replace(/.(AI|BI|CI)([1-3])$/g, '');

      // Update table with last day's totals
      const totalsTable = document.getElementById('totalsTable');

      document.getElementById('lastReadingCell').innerText = data.lastdaylastReading;
      document.getElementById('lastdaysTotalCell').innerText = data.lastdaysTotal;
      document.getElementById('lastlifeTotalCell').innerText = data.lastlifeTotal;

      document.getElementById('todayReadingCell').innerText = data.todaylastReading;
      document.getElementById('todaysTotalCell').innerText = data.todaysTotal;
      document.getElementById('todaylifeTotalCell').innerText = data.todayslifeTotal;

      document.getElementById('loadingIcon').style.display = 'none';
      document.getElementById('fmDataContainer').style.display = 'block';

    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error and hide loading icon if there's an error
      document.getElementById('loadingIcon').style.display = 'none';
      alert('Error fetching data. Please try again.');
    }
  });
});



