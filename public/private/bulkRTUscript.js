
let records = [];
let currentIndex = 0;
let dataRecords = [];
let lastfetchedRecordId = 0;
let lastrequestedID = 0;

document.getElementById('fileInput').addEventListener('change', function (event) {
    records = [];
    currentIndex = 0;
    dataRecords = [];
    lastfetchedRecordId = 0;
    lastrequestedID = 0;

    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            let lines = e.target.result.split('\n');
            records = lines.map(line => line.trim()).filter(line => line.length > 0);
            addConsoleMessage('Total records to process:' + records.length);
            const startTime = $("#startTimePicker").find("input").val();
            const endTime = $("#endTimePicker").find("input").val();
            document.getElementById('loadingIcon').style.display = 'block';
            fetchrecords(lastrequestedID, startTime, endTime);
        };
        reader.readAsText(file);
    }
});

function updateCount(count) {
    document.getElementById('countElement').textContent = count;
    if (count <= 4 && lastfetchedRecordId > 6) {
        fetchnextRecord();
    }
}


function fetchrecords(index, startTime, endTime) {
    console.log('lastrequestedID', lastrequestedID, 'currentIndex', currentIndex)
    if (index >= records.length - 1) {
        addConsoleMessage('All records processed');
        return;
    }
    lastrequestedID = index;

    let [dlpNo, fmID] = records[index].split('-');
    $.ajax({
        url: '/bulkRTU/query',
        method: 'POST',
        data: JSON.stringify({ dlpNo, fmID, startTime, endTime }),
        contentType: 'application/json',
        success: function (data) {
            dataRecords[index] = data;
            addConsoleMessage(dlpNo + '-' + fmID + ':' + ' records fetched');
            lastfetchedRecordId = index;
            updateCount(lastfetchedRecordId - currentIndex);
            if (index < 6) {
                fetchrecords(index + 1, startTime, endTime); // Fetch the next record
            } else if (index == 6) {
                addConsoleMessage('First 7 records fetched');
                loadgraph(dataRecords[currentIndex]);
            }
        },
        error: function (err) {
            console.log('Error fetching data:', dlpNo, '-', fmID, err);
            fetchrecords(index + 1, startTime, endTime);
        }
    });

}

function fetchnextRecord() {
    const startTime = $("#startTimePicker").find("input").val();
    const endTime = $("#endTimePicker").find("input").val();
    fetchrecords(lastrequestedID + 1, startTime, endTime);
}

function loadgraph(dataRecord) {
    updateCount(lastfetchedRecordId - currentIndex);
    if (dataRecord.length <= 0) {
        currentIndex++;
        loadgraph(dataRecords[currentIndex]);
        fetchnextRecord();
        let [dlpNo, fmID] = records[currentIndex - 1].split('-');
        let status = 'Not Ok';
        const startTime = $("#startTimePicker").find("input").val();
        const endTime = $("#endTimePicker").find("input").val();
        let remarks = 'No data Availiable for ' + startTime + ':' + endTime;
        $.ajax({
            url: '/bulkRTU/submit',
            method: 'POST',
            data: JSON.stringify({ dlpNo, fmID, status, remarks }),
            contentType: 'application/json',
            success: function () {
            },
            error: function (err) {
                console.error('Error submitting response:', err);
            }
        });
        alert('Data Not loaded for' + records[currentIndex - 1]);
    }
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
        const data = dataRecord;

        // Load data into Highcharts graph
        // Example: Assuming data is an array of objects with timestamps and values
        Highcharts.chart('chartContainer1', {
            ...zoomOptions,
            title: { text: 'Flow rate (m3/hr)' },
            series: [{
                cropThreshold: 9999,
                name: data[0].tagName,
              data: data.filter(item => item.tagName.endsWith('Instant_Flow'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
            }]
        });

        Highcharts.chart('chartContainer2', {
            ...zoomOptions,
            title: { text: 'Today\' Flow (m3)' },
            series: [{
                cropThreshold: 9999,
                name: data[0].tagName,
                data: data.filter(item => item.tagName.endsWith('Todays_Flow'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
            }]
        });

        Highcharts.chart('chartContainer3', {
            ...zoomOptions,
            title: { text: 'Lifetime\' Total (m3)' },
            series: [{
                cropThreshold: 9999,
                name: data[0].tagName,
                data: data.filter(item => item.tagName.endsWith('Totalizer'))
            .map(item => { return [new Date(item.timestamp).getTime() + 19800000, parseFloat(item.value)] })
            }]
        });


        document.getElementById('tagNumber').innerText = data[0].tagName.replace(/.(AI|BI|CI)([1-3])$/g, '');

        document.getElementById('loadingIcon').style.display = 'none';
        document.getElementById('fmDataContainer').style.display = 'block';
    } catch (error) {
        console.error('Error fetching data:', error);
        // Handle error and hide loading icon if there's an error
        document.getElementById('loadingIcon').style.display = 'none';
        alert('Error fetching data. Please try again.');
    }


}


document.getElementById('okButton').addEventListener('click', function () {
    submitResponse('OK');
});

document.getElementById('notOkButton').addEventListener('click', function () {
    submitResponse('Not OK');
});

function submitResponse(status) {
    let remarks = document.getElementById('remarks').value;
    let [dlpNo, fmID] = records[currentIndex].split('-');
    $.ajax({
        url: '/bulkRTU/submit',
        method: 'POST',
        data: JSON.stringify({ dlpNo, fmID, status, remarks }),
        contentType: 'application/json',
        success: function () {
            currentIndex++;
            document.getElementById('remarks').value = '';
            loadgraph(dataRecords[currentIndex]);
            const startTime = $("#startTimePicker").find("input").val();
            const endTime = $("#endTimePicker").find("input").val();
            fetchrecords(lastrequestedID + 1, startTime, endTime);
        },
        error: function (err) {
            console.error('Error submitting response:', err);
        }
    });
}

document.getElementById('removeButton').addEventListener('click', () => {
    fetch('/bulkRTU/remove', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        // Optionally, include a body if needed
        // body: JSON.stringify({ key: 'value' })
    })
        .then(response => response.json()) // Assuming the server responds with JSON
        .then(data => {
            alert('Response: ' + JSON.stringify(data));
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Check the console for details.');
        });
});



document.addEventListener('DOMContentLoaded', function () {

});



