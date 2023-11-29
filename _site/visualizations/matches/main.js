
var svgMatch = d3.select(".match-div").append("svg")
.attr("width", "1300")
.attr("height", "480");


// Get layout parameters
var svgMatchWidth = +svgMatch.attr('width');
var svgMatchHeight = +svgMatch.attr('height');

var padding = {t: 40, r: 0, b: 0, l: 40};
var cellPadding = 10;

// Create a group element for appending chart elements
var chartG = svgMatch.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var dataAttributes = ['home shots', 'home possession', 'home won corners', 'away shots'];
var N = dataAttributes.length;

// Compute chart dimensions
var cellWidth = (1700 - padding.l - padding.r) / N;
var cellHeight = (1700 - padding.t - padding.b) / N;


// Global x and y scales to be used for all SplomCells
var xScale = d3.scaleLinear().range([0, cellWidth - cellPadding]);
var yScale = d3.scaleLinear().range([cellHeight - cellPadding, 0]);

// axes that are rendered already for you
var xAxis = d3.axisTop(xScale).ticks(6).tickSize(-cellHeight * N, 0, 0);
var yAxis = d3.axisLeft(yScale).ticks(6).tickSize(-cellWidth * N, 0, 0);
// Ordinal color scale for cylinders color mapping
var colorScale = d3.scaleOrdinal(d3.schemeCategory10);
// Map for referencing min/max per each attribute
var extentByAttribute = {};
// Object for keeping state of which cell is currently being brushed
var brushCell;

var cars;

// ****** Add reusable components here ****** //
function SplomCell(x, y, col, row) {
    this.x = x;
    this.y = y;
    this.col = col;
    this.row = row;
}

SplomCell.prototype.init = function(g) {
    var cell = d3.select(g);

    cell.append('rect')
      .attr('class', 'frame')
      .attr('width', cellWidth - cellPadding)
      .attr('height', cellHeight - cellPadding);
}

SplomCell.prototype.update = function(g, data, colorScale, colorAttr) {
    var cell = d3.select(g);

    // Update the global x,yScale objects for this cell's x,y attribute domains
    xScale.domain(extentByAttribute[this.x]);
    yScale.domain(extentByAttribute[this.y]);

    // Save a reference of this SplomCell, to use within anon function scopes
    var _this = this;

    cell.selectAll('.dotMatch').remove();

    var dots = cell.selectAll('.dotMatch')
        .data(data, function(d){
            return d.home +'-'+d.year+'-'+d.home_possessionPct; // Create a unique id for the car
        });

var dotsEnter = dots.enter()
    .append('circle')
    .attr('class', 'dotMatch')
    .style("fill", function(d) {
        return colorScale(d[colorAttr]); // Use the 'outcome' values directly
    })
    .attr('r', 4);

    dotsEnter.on('mouseover', toolTip.show)
        .on('mouseout', toolTip.hide);

    dots.merge(dotsEnter).attr('cx', function(d){
            return xScale(d[_this.x]);
        })
        .attr('cy', function(d){
            return yScale(d[_this.y]);
        });

    dots.exit().remove();
}




var cells = [];
// Create cells for the second, third, and fourth scatter plots in the first row
for (var col = 1; col < 4; col++) {
    cells.push(new SplomCell(dataAttributes[col], dataAttributes[0], col - 1, 0));
}


var brush = d3.brush()
    .extent([[0, 0], [cellWidth - cellPadding, cellHeight - cellPadding]])
    .on("start", brushstart)
    .on("brush", brushmove)
    .on("end", brushend);


function brushstart(cell) {
    // cell is the SplomCell object

    // Check if this g element is different than the previous brush
    if(brushCell !== this) {

        // Clear the old brush
        brush.move(d3.select(brushCell), null);

        // Update the global scales for the subsequent brushmove events
        xScale.domain(extentByAttribute[cell.x]);
        yScale.domain(extentByAttribute[cell.y]);

        // Save the state of this g element as having an active brush
        brushCell = this;
    }
}

function brushmove(cell) {
    // cell is the SplomCell object

    // Get the extent or bounding box of the brush event, this is a 2x2 array
    var e = d3.event.selection;
    if (e) {

        // Select all .dot circles
        var dotMatchSelection = svgMatch.selectAll(".dotMatch");

        // var xx = d3.selectAll('.dotMatch');
        // console.log(xx.nodes())


        // Add the "hidden" class if the data for that circle
        // lies outside of the brush-filter applied for this SplomCells x and y attributes
        dotMatchSelection.classed("hidden", function (d) {
            return (
                e[0][0] > xScale(d[cell.x]) || xScale(d[cell.x]) > e[1][0] ||
                e[0][1] > yScale(d[cell.y]) || yScale(d[cell.y]) > e[1][1]
            );
        });
    }
}

function brushend() {
    // If there is no longer an extent or bounding box then the brush has been removed
    if(!d3.event.selection) {
        // Bring back all hidden .dot elements
        svgMatch.selectAll('.hidden').classed('hidden', false);
        // Return the state of the active brushCell to be undefined
        brushCell = undefined;
    }
}
// dataAttributes = ['economy (mpg)home_shotsSummary', 'cylinders', 'power (hp)', '0-60 mph (s)'];
var toolTip = d3.tip()
    .attr("class", "d3-tip")
    .offset([-12, 0])
    .html(function(d) {
        return "<h5>"+d['home']+"</h5><table><thead><tr><td>Away team</td><td>Outcome</td><td>home score</td><td>away score</td></tr></thead>"
             + "<tbody><tr><td>"+d['away']+"</td><td>"+d['outcome']+"</td><td>"+d['home_score']+"</td><td>"+d['away_score']+"</td></tr></tbody>"
             + "<thead><tr><td>home shots</td><td colspan='1'>away shots</td><td colspan='1'>home formation</td><td>away formation</td></tr></thead>"
             + "<tbody><tr><td>"+d['home shots']+"</td><td colspan='1'>"+d['away shots']+"</td><td colspan='1'>"+d['home_formation']+"</td><td>"+d['away_formation']+"</td></tr></tbody></table>"
    });


svgMatch.call(toolTip);

var cellEnter;

function onColorChange() {
    var select = d3.select('#colorAttrSelector').node();
    var attr = select.options[select.selectedIndex].value;

    // Assuming you want to use a categorical color scale
    var newColorScale;
    if (attr === 'outcome') {
        newColorScale = d3.scaleOrdinal()
            .domain(['win', 'loss', 'draw'])
            .range(['green', 'red', 'blue']);
    } else {
        // Assuming you want to use a sequential color scale for other attributes
        var max = d3.max(cars, function (d) { return +d[attr]; });
        var min = d3.min(cars, function (d) { return +d[attr]; });
        newColorScale = d3.scaleSequential([min, max], d3.interpolateBlues);
    }

    // Update the global color scale
    colorScale = newColorScale;

    cellEnter.each(function (cell) {
        cell.init(this);
        cell.update(this, cars, colorScale, attr);
    });
}




d3.csv('./visualizations/matches/matches.xls', dataPreprocessor).then(function(dataset) {

        cars = dataset;

        // Create map for each attribute's extent
        dataAttributes.forEach(function(attribute){
            extentByAttribute[attribute] = d3.extent(dataset, function(d){
                return d[attribute];
            });
        });

    chartG.selectAll('.x.axis')
        .data(dataAttributes.slice(1, 4)) // Start from the second attribute
        .enter()
        .append('g')
        .attr('class', 'x axis')
        .attr('transform', function(d, i) {
            return 'translate(' + [i * cellWidth + cellPadding / 2, 0] + ')';
        })
        .each(function(attribute) {
            xScale.domain(extentByAttribute[attribute]);
            d3.select(this).call(xAxis);
            d3.select(this)
                .append('text')
                .text(attribute)
                .attr('class', 'axis-label')
                .attr('transform', 'translate(' + [cellWidth / 2, -20] + ')');
        });

    chartG.selectAll('.y.axis')
        .data([dataAttributes[0]]) // Only the first attribute for y-axis
        .enter()
        .append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(' + [0, cellPadding / 2] + ')')
        .each(function(attribute) {
            yScale.domain(extentByAttribute[attribute]);
            d3.select(this).call(yAxis);
            d3.select(this)
                .append('text')
                .text(attribute)
                .attr('class', 'axis-label')
                .attr('transform', 'translate(' + [-26, cellHeight / 2] + ')rotate(270)');
        });


        // ********* Your data dependent code goes here *********//

        var outcomeColorScale = d3.scaleOrdinal()
            .domain(['win', 'loss', 'draw'])
            .range(['green', 'red', 'gray']);

        cellEnter = chartG.selectAll('.cell')
        .data(cells)
        .enter()
        .append('g')
        .attr('class', 'cell')
        .attr('transform', function(d) {
            return 'translate(' + [d.col * cellWidth + cellPadding / 2, cellPadding / 2] + ')';
        });

        cellEnter.append('g')
            .attr('class', 'brush')
            .call(brush);

        cellEnter.each(function (cell) {
            cell.init(this);
            // Make sure 'outcome' is the correct attribute for coloring
            cell.update(this, dataset, outcomeColorScale, 'outcome');
        });


    });

// ********* Your event listener functions go here *********//


// Remember code outside of the data callback function will run before the data loads

function dataPreprocessor(row) {
    // Parse the percentage values and convert formations to arrays
    const home_shotsSummary = parseFloat(row['home_shotsSummary'].replace('%', ''));
    const away_shotsSummary = parseFloat(row['away_shotsSummary'].replace('%', ''));

    const home_possessionPct = parseFloat(row['home_possessionPct'].replace('%', ''));

    const homeFormation = row['home_formation'].split('-').map(Number);
    const awayFormation = row['away_formation'].split('-').map(Number);

    // Extract only the numeric part from strings like "21 (7)"
    const extractNumeric = (str) => {
        const matches = str.match(/\d+/);
        return matches ? +matches[0] : 0; // Convert the first match to a number or default to 0
    };

    // Determine match outcome based on scores
    let outcome;
    if (row['home_score'] > row['away_score']) {
        outcome = 'win';
    } else if (row['home_score'] < row['away_score']) {
        outcome = 'loss';
    } else {
        outcome = 'draw';
    }

    return {
        'home': row['home'],
        'home shots': home_shotsSummary,
        'home possession': home_possessionPct,
        'home_score': row['home_score'],
        'good': home_possessionPct/(+row['home_score']+1),
        'away_saves': row['away_saves'],
        'away_score': row['away_score'],
        'home_foulsCommitted': row['home_foulsCommitted'],
        'away': row['away'],
        'home_formation': homeFormation,
        'home won corners': extractNumeric(row['home_wonCorners']),
        'attendance': row['attendance'],
        'away_formation': awayFormation,
        'away shots': away_shotsSummary,
        'year': +row['year'],
        'outcome': outcome  // New attribute indicating match outcome
    };
}
