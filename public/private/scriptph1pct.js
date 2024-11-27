document.addEventListener('DOMContentLoaded', async function () {


  const locationsDropdown = document.getElementById('location');

  const responseLocations = await fetch(`/ph1/locations`);
  const locationsData = await responseLocations.json();
  locationsData.forEach(location => {
    const option = document.createElement('option');
    option.value = location;
    option.textContent = location;
    locationsDropdown.appendChild(option);
  });

  // Populate instruments dropdown based on selected location
  const instrumentsDropdown = document.getElementById('tagName');
  locationsDropdown.addEventListener('change', async function () {
    const selectedLocation = this.value;
    if (selectedLocation.length > 0) {
      const responseInstruments = await fetch(`/ph1/pcttags/${selectedLocation}`);
      const instrumentsData = await responseInstruments.json();
      // Clear previous options
      instrumentsDropdown.innerHTML = '';
      instrumentsData.forEach(tagName => {
        const option = document.createElement('option');
        option.value = tagName;
        option.textContent = tagName;
        instrumentsDropdown.appendChild(option);
      });
    } else {
      instrumentsDropdown.innerHTML = '';
    }
  });



  const form = document.getElementById('dataForm');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    // const location = document.getElementById('location').value;
    const tagName = document.getElementById('tagName').value;
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
      const response = await fetch(`/ph1/data?objectname=${tagName}&startTime=${startTime}&endTime=${endTime}`);
      const data = await response.json();

      // Load data into Highcharts graph
      // Example: Assuming data is an array of objects with timestamps and values

      let unit = '';

      if (tagName.includes('_FT') || tagName.includes('_FTE')) {
        unit = 'Flow rate (m3/hr)'
      } else if (tagName.includes('_LT') || tagName.includes('_LTE')) {
        unit = 'Level (ft)'
      } else if (tagName.includes('_PT') || tagName.includes('_PTE')) {
        unit = 'Pressure (psi)'
      }


      Highcharts.chart('chartContainer1', {
        ...zoomOptions,
        title: { text: 'Flow rate (m3/hr)' },
        series: [{
          name: data[0].tagName,
          data: data.map(item => { return [new Date(item.timestamp).getTime()+ 19800000, parseFloat(item.value)] })
        }]
      });

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



