// Download data:
d3.queue()
    .defer(d3.json, 'https://opendata.bristol.gov.uk/resource/e9sc-yei5.json')
    .defer(d3.json, 'https://opendata.bristol.gov.uk/resource/yhz4-hcsf.json')
    .defer(d3.json, 'https://opendata.bristol.gov.uk/resource/3zdy-g2u6.json')
    .awaitAll(ready);

function hourData(error, json) {
    if (error) throw error;

    var out = [];
    for (var i = 0; i < json.length; i++) {
        out.push({
            "hour": json[i].hh,    // 01:00 & 04:00 missing data ?
            "sev": json[i].count_severity
        });
    }
    return out;
}
function dayData(error, json) {
    if (error) throw error;

    var out = [];
    for (var i = 0; i < json.length; i++) {
        out.push({
            "day": json[i].dow,    // 0 = Monday
            "sev": json[i].count_severity
        });
    }
    return out;
}
function monthData(error, json) {
    if (error) throw error;

    var out = [];
    for (var i = 0; i < json.length; i++) {
        out.push({
            "month": json[i].mm,   // 1 = January
            "sev": json[i].count_severity
        });
    }
    return out;
}

// Execute when data available:
function ready(error, data) {
    if (error) console.log(error);

    var hourly = data[0],
        daily = data[1],
        monthly = data[2];

    // Prep data (as one long array, 24 segments * 7 rings):
    var weekdata = [];
    for (var j = 0; j < daily.length; j++) {
        for (var k = 0; k < hourly.length; k++) {
            // Use the product of the hourly and daily value:
            weekdata.push(parseInt(hourly[k].count_severity, 10) * parseInt(daily[j].count_severity, 10));
        }
    }

    // Prepare heatchart:
    var heatChart1 = circularHeatChart()
        .innerRadius(20)
        .numSegments(22)
        .domain([0,15000])
        .range(["white", "red"])
        .radialLabels(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"])
        .segmentLabels(["Midnight", "2am", "3am", "5am", "6am", "7am", "8am", "9am", "10am", "11am",
            "Midday", "1pm", "2pm", "3pm", "4pm", "5pm", "6pm", "7pm", "8pm", "9pm", "10pm", "11pm"]);

    // Render chart:
    d3.select('#heatChart').selectAll('svg')
        .data([weekdata])
        .enter()
            .append('svg')
            .call(heatChart1);

}
