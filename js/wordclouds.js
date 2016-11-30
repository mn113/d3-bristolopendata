var stopwords = [];
d3.json("../data/stopwords_en.json", function(values) {
    for (var i = 0; i < values.length; i++) {
        stopwords.push(values[i].replace("'",""));
    }
    console.log(stopwords);

    makeCloud("../data/marge_10000.json", "#margeCloud", 150, 940);
    makeCloud("../data/flanders_all.json", "#nedCloud", 20, 242);
});

function makeCloud(dataUrl, container, minCount, maxCount) {
    d3.json(dataUrl, function(json) {
        console.log(json.length);

        // Get just the words we want from data array:
        var words = json.filter(function(d) {
            // Reject short words or stopwords:
            if (d.word.length <= 2 || stopwords.indexOf(d.word) >= 0) return false;
            // Keep only words within the count bounds:
            return d.count >= minCount && d.count <= maxCount;
        });
        console.log(words.length);

        // Define font scaling function:
        var fontScale = d3.scale.log()
            .base(10)
            .domain([minCount, maxCount])
            .range([10, 60])    // desired font sizes in px
            .clamp(true);

        // Define colour palette:
        var palette = d3.scale.category10();

        // Make cloud
        var layout = d3.layout.cloud()
            .size([500,350])
            .words(words)
                .padding(5)
                .rotate(function() { return [-60,-30,0,30,60][~~(Math.random() * 5)]; })  // 0-4
                .font("Impact")
                .fontSize(function(d) { return 8 + Math.sqrt(1600 * d.count / maxCount); }) // 8-48px
                .on("end", draw);
        layout.start();

        // Render:
        function draw(words) {
            d3.select(container).append("svg")
                .attr("width", layout.size()[0])
                .attr("height", layout.size()[1])
                .append("g")
                    .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
                    .selectAll("text")
                    .data(words)
                    .enter().append("text")
                        .text(function(d) { return d.word; })
                        .attr("text-anchor", "middle")
                        .attr("transform", function(d) {
                            // Position & rotation determined by cloud plugin:
                            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
                        })
                        .style("font-family", "Impact")
                        .style("font-size", "1px")
                        .transition().duration(1000)    // scale up on load
                        .style("font-size", function(d) { return d.size; })
                        .style("fill", function(d) { return palette(d.count % 10); });  // sequential from 20-colour palette

        }
    });
}
