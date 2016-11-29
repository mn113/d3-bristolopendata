var data = [];
var dataMax;

var tooltip = d3.select("body")
    .append("div").classed("tooltip", true)
        .style("position", "absolute")
        .style("z-index", "1")
        .style("visibility", "hidden");

// Import JSON data:
d3.json("https://opendata.bristol.gov.uk/resource/tvv6-zwh5.json", function(error, rows) {
    if (error) throw error;
    // Extract useful parts from JSON:
    rows.forEach(function(r) {
        if (r.ugm3_2013) {   // discard missing data points
            data.push({
                site: r.site,
                no2: r.ugm3_2013,
                coordinates: r.location_1.coordinates,
                type: "Point"   // GeoJSON
            });
        }
    });
    // Store maximum data value:
    dataMax = d3.max(data.map(function(dataPoint) {
        return dataPoint.no2;
    }));
    //console.log(data);

    // Make map:
    renderMap();
    // Make chart:
    renderChart('descending');
});

function renderChart(d3Comparator) {

    if(d3Comparator) data = data.sort(function (a,b) {
        return d3[d3Comparator](a.no2, b.no2);      // uses d3.ascending() or d3.descending() sorters
    });

    var width = 550,
        barHeight = 20;

    var chartsvg = d3.select("#barChart")
        .attr("width", width)
        .attr("height", barHeight * data.length);
    chartsvg.selectAll("g").remove();      // Clear previous chart elements

    // Scaling function:
    var x = d3.scaleLinear()
        .domain([0, dataMax])
        .range([0, width - 75]);

    var bar = chartsvg.selectAll("g")      // The elements we _want_ to have
        .data(data)
            .enter().append("svg:g")        // for every datum that "enters", append a <g>
        .attr("transform", function(d, i) { return "translate(0," + i * barHeight + ")"; });

    bar.append("svg:rect")
        .attr("width", function(d) { return x(d.no2); })
        .attr("height", barHeight - 1)
        .attr("fill", function(d) { return d3.interpolateRdYlGn((dataMax - d.no2) / dataMax); });

    bar.append("svg:text")
        .attr("x", function(d) { return x(d.no2) - 4; })
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .text(function(d) { return d.no2; });

    bar.append("svg:text")
        .attr("x", function(d) { return x(d.no2) + 2; })
        .attr("y", barHeight / 2)
        .attr("dy", ".35em")
        .attr("class", "label")
        .text(function(d) { return d.site; });
}

function renderMap() {
    // Define MapBox-GL basemap:
    mapboxgl.accessToken = 'pk.eyJ1IjoibWVlcmthdG9yIiwiYSI6ImNpdXF4Mm91azAwMGEyb21pcDFmN3J5NXcifQ.pW6SQDz9wpFr619vzHtcAA';
    var map = new mapboxgl.Map({
        container: 'no2map', // container id
        style: 'mapbox://styles/mapbox/light-v9',
        center: [-2.6, 51.46],
        zoom: 12,
    });
    map.scrollZoom.disable();
    map.addControl(new mapboxgl.Navigation());

    // Use the MapBox positioning to define a d3 projection:
    function getD3() {
        var bbox = document.getElementById('no2map').getBoundingClientRect();
        var center = map.getCenter();
        var zoom = map.getZoom();
        // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
        var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);

        var d3projection = d3.geoMercator()     // NOT RIGHT ??
            .center([center.lng, center.lat])
            .translate([bbox.width/2, bbox.height/2])
            .scale(scale);

        return d3projection;
    }

    // Set up our SVG layer that we can manipulate with d3
    var container = map.getCanvasContainer();
    var svg = d3.select(container).append("svg:svg")
        .attr("width", map.getCanvas().width)
        .attr("height", 500);
    svg.append("svg:g");

    // Create dots and apply the data to them:
    var dots = svg.select("g").selectAll("circle.dot")
        .data(data);

    // Define how the dots will look and behave:
    dots.enter().append("svg:circle").classed("dot", true)
        .attr("r", 1)
        .attr("fill", function(d) { return d3.interpolateRdYlGn((dataMax - d.no2) / dataMax); })   // Funky colours
        .transition().duration(1000)    // Make dots grow to size on load
        .attr("r", 6);

    svg.selectAll("circle.dot")
        .on("mouseover", function(d) {
            tooltip.text(d.site + ": " + d.no2 + "μg/m3");
            tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
            tooltip.style("visibility", "visible");
        })
        .on("mouseout", function() {
            return tooltip.style("visibility", "hidden");
        });

    // Write (x,y) pixel cooordinates to all the dots:
    function render() {
        // Apply our projection:
        var d3Projection = getD3();
        d3.geoPath().projection(d3Projection);

        svg.selectAll("circle.dot")
            .attr("cx", function(d) { return d3Projection(d.coordinates)[0]; })
            .attr("cy", function(d) { return d3Projection(d.coordinates)[1]; });
    }

    // Re-render our visualization whenever the view changes:
    map.on("viewreset", render);
    map.on("move", render);

    // Render our initial visualization:
    render();
}
