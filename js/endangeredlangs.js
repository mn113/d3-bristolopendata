var mydata = [];

var statuses = [
    'Vulnerable',
    'Definitely endangered',
    'Severely endangered',
    'Critically endangered',
    'Extinct'
];
var colours = [
    "rgb(255,255,204)",  //y
    "rgb(254,191,91)",  //o
    "rgb(242,61,38)",  //o
    "rgb(128,0,38)",   //r
    "rgb(0,0,0)"
];

// Import JSON data:
d3.csv("data/endangered-utf8.csv", function(error, rows) {
    if (error) throw error;

    // Extract useful parts from JSON:
    rows.forEach(function(r) {
        if (r.lat) {   // discard missing data points
            mydata.push({
                name: r.name,
                status: r.status,
                statusCode: statuses.indexOf(r.status),
                number: r.number,
                coordinates: [+r.long, +r.lat], // coerce to numbers
                type: "Point"   // GeoJSON
            });
        }
    });

    // Make map:
    renderMap();
});

function renderMap() {
    // Define MapBox-GL basemap:
    mapboxgl.accessToken = 'pk.eyJ1IjoibWVlcmthdG9yIiwiYSI6ImNpdXF4Mm91azAwMGEyb21pcDFmN3J5NXcifQ.pW6SQDz9wpFr619vzHtcAA';
    var map = new mapboxgl.Map({
        container: 'langmap', // container id
        style: 'mapbox://styles/mapbox/light-v9',
        center: [0,20],
        zoom: 1,
    });
    map.scrollZoom.disable();
    map.addControl(new mapboxgl.Navigation());

    // Use the MapBox positioning to define a d3 projection:
    function getD3() {
        var bbox = document.getElementById('langmap').getBoundingClientRect();
        var center = map.getCenter();
        var zoom = map.getZoom();
        // 512 is hardcoded tile size, might need to be 256 or changed to suit your map config
        var scale = (512) * 0.5 / Math.PI * Math.pow(2, zoom);

        var d3projection = d3.geoMercator()
            .center([center.lng, center.lat])
            .translate([bbox.width/2, bbox.height/2])
            .scale(scale);

        return d3projection;
    }

    // Log-scale the radii of the circles:
    var logScale = d3.scaleLog()
        .base(10)
        .domain([1, 7500001])
        .range([2, 15]);    // pixels of dot radius

    // Set up our SVG layer that we can manipulate with d3
    var svg = d3.select(map.getCanvasContainer())
        .append("svg:svg")
            .attr("width", map.getCanvas().width)
            .attr("height", 500);
    svg.append("svg:g");

    console.log(mydata.length);
    // Create dots and apply the data to them:
    var dots = svg.select("g").selectAll("circle.dot")
        .data(mydata);

    // Define how the dots will look and behave:
    dots.enter().append("svg:circle").classed("dot", true)
        .attr("r", 1)
        .attr("fill", function(d) {
            // Black dot if 4, map red-green to 0-3:
            return d.statusCode === 4 ? "#000000" : d3.interpolateYlOrRd((3 - d.statusCode)/3 );
        })
        .transition().duration(1000)    // Make dots grow to size on load
        .attr("r", function(d) { return logScale(d.number + 1); }); // adding 1 to avoid log(0)

    (function addTooltips() {    // IIFE
        var tooltip = d3.select("body")
            .append("div").classed("tooltip", true)
                .style("position", "absolute")
                .style("z-index", "1")
                .style("visibility", "hidden");

        // Show tooltips on circle hover:
        svg.selectAll("circle.dot")
            .on("mouseover", function(d) {
                tooltip.text(d.name + ": " + d.number + " speakers (" + d.status + ")");
                tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");
                tooltip.style("visibility", "visible");
            })
            .on("mouseout", function() {
                return tooltip.style("visibility", "hidden");
            });
    }());

    (function makeLegend() {    // IIFE
        // Legend stuff:
        var mapColourScale = d3.scaleOrdinal()
            .domain(statuses)
            .range(colours);

        svg.append("svg:g")
            .attr("class", "legendOrdinal")
            .attr("transform", "translate(20,385)")
            .append("svg:rect");    // styled in CSS

        var legendOrdinal = d3.legendColor()
            //d3 symbol creates a path-string -> triangle
            .shape("path", d3.symbol().type(d3.symbolTriangle).size(150)())
            .shapePadding(10)
            .scale(mapColourScale);

        svg.select(".legendOrdinal")
            .call(legendOrdinal);
    }());

    // Write (x,y) pixel coordinates to all the dots:
    function render() {
        // Apply our projection:
        var d3Projection = getD3();
        d3.geoPath().projection(d3Projection);

        //console.log("Zoom", map.options.zoom);

        // Get slider range so we can hide some dots:
        var filterInput = document.querySelector("#speakersRange"),
            filterMax = Math.pow(10, filterInput.value);

        svg.selectAll("circle.dot")
            .attr("cx", function(d) { return d3Projection(d.coordinates)[0]; })
            .attr("cy", function(d) { return d3Projection(d.coordinates)[1]; })
            .attr("visibility", function(d) { return (d.number <= filterMax) ? 'visible' : 'hidden'; });

        updateHeadline(filterMax);
    }

    function updateHeadline(fmax) {
        // Can't seem to get count of visible dots easily
        var text = "Languages with under " + fmax + " speakers";
        d3.select("h3").text(text);
    }

    // Re-render our visualization whenever the view changes:
    map.on("move", render);
    map.on("viewreset", render);
    d3.select("#speakersRange").on("change", render);

    // Render our initial visualization:
    render();
}
