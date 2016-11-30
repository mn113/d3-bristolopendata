var fs = require('fs');
var WordCounter = require('wordcounter');
var wordcounter = new WordCounter({
    minlength: 2,
    mincount: 2,
    ignore: [],
    ignorecase: true
});

var inputfile = process.argv[2];

fs.readFile(inputfile, function(err, data) {
    if (err) throw err;

    data = wordcounter.count(data.toString());

    fs.writeFile(inputfile + '.json', JSON.stringify(data), function (err) {
        if (err) throw err;

        console.log('Done, without errors.');
    });
});
