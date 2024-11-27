document.addEventListener('DOMContentLoaded', function () {


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
      const response = await fetch(`/data?dlp=${dlp}&flowmeter=${flowmeter}&startTime=${startTime}&endTime=${endTime}`);
      const data = await response.json();

      // Load data into Highcharts graph
      // Example: Assuming data is an array of objects with timestamps and values
      Highcharts.chart('chartContainer1', {
        ...zoomOptions,
        title: { text: 'Flow rate (m3/hr)' },
        series: [{
          name: data.data[0].tagName,
          data: data.data.filter(item => item.tagName.endsWith('.AI1') || item.tagName.endsWith('.BI1') || item.tagName.endsWith('.CI1'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
        }]
      });

      Highcharts.chart('chartContainer2', {
        ...zoomOptions,
        title: { text: 'Today\' Flow (m3)' },
        series: [{
          name: data.data[0].tagName,
          data: data.data.filter(item => item.tagName.endsWith('.AI2') || item.tagName.endsWith('.BI2') || item.tagName.endsWith('.CI2'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
        }]
      });

      Highcharts.chart('chartContainer3', {
        ...zoomOptions,
        title: { text: 'Lifetime\' Total (m3)' },
        series: [{
          name: data.data[0].tagName,
          data: data.data.filter(item => item.tagName.endsWith('.AI3') || item.tagName.endsWith('.BI3') || item.tagName.endsWith('.CI3'))
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



