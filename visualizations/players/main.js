

function dataPreprocessor(row) {
    return {
        'Player': row['Player'],
        'GP': +row['GP'],
        'MINS': +row['MINS'] / +row['GP'],
        'S/90min': +row['SHTS'] / +row['MINS'] * 90,
        'G/90min': +row['G/90min'],
        'SOG': +row['SOG%'],
        'Year': +row['Year']
    };
}

function angleToCoordinate(angle, value){
    let x = Math.cos(angle) * radialScale(value);
    let y = Math.sin(angle) * radialScale(value);
    return {"x": x_pad + width / 2 + x, "y": y_pad + height / 2 - y};
}

function getPathCoordinates(data_point){
    let coordinates = [];
    for (var i = 0; i < features.length; i++){
        let ft_name = features[i];
        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        coordinates.push(angleToCoordinate(angle, 
            (data_point[ft_name] - scales[ft_name][0]) / (scales[ft_name][1] - scales[ft_name][0])));
    }
    coordinates.push(coordinates[0])
    return coordinates;
}

var dataset_all, dataset;
var features, scales;
var x_pad, y_pad, width, height, svg, radialScale, ticks, featureData, line, colors;
var player_to_id;
var selectedYear, selectedItems;
var colors = ["darkorange", "navy", "#006400", "#DC143C", "#00BFFF", "#FF00FF", "#A0522D", "gray"];
var itemColors = {};

function updateData() {
    // change data based on selectedYear

    dataset = dataset_all.filter(function(d) { 
        if( d["Year"] == selectedYear)  { 
            let flag = 1;
            for (const [key, value] of Object.entries(d)) {
                if (key != "Player" && isNaN(value)) {
                    flag = 0;
                    break;
                }
            }
            if (flag == 1) return d;
        } 
    })

    // console.log(dataset)


    
    player_to_id = {}
    for (var i = 0; i < dataset.length; i++){
        player_to_id[dataset[i]["Player"]] = i;
    }

    // console.log(player_to_id)
    
    updateSearchBox()
}


function updateChart(players_set) {
    players_set = Array.from(players_set);
    let player_ids = []
    for (var i = 0; i < players_set.length; i++){
        player_ids.push(player_to_id[players_set[i]])
    }


    let data = [];
    for (var i = 0; i < player_ids.length; i++){
        var player_id = player_ids[i]
        var point = {}
        // features.forEach(f => point[f] = scales[f][0] + Math.random() * (scales[f][1] - scales[f][0]));
        features.forEach(f => point[f] = dataset[player_id][f]);
        data.push(point);
    }
    

    scales = {"MINS": [0, 90],
        "G/90min": [0, 1],
        "S/90min": [0, 1],
        "GP": [0, 10],
        "SOG": [0, 100]}

    if(data.length > 0) {
        scales = {"MINS": [0, Math.max(90, d3.max(data, function(d) { return +d["MINS"];}))],
            "G/90min": [0, Math.max(0.5, d3.max(data, function(d) { return +d["G/90min"];}))],
            "S/90min": [0, Math.max(0.5, d3.max(data, function(d) { return +d["S/90min"];}))],
            "GP": [0, Math.max(1, d3.max(data, function(d) { return +d["GP"];}))],
            "SOG": [0, 100]}
    }


    

    // draw the path element
    svg.selectAll(".path-cls").remove();
    svg.selectAll("path")
        .data(data)
        .join(
            enter => enter.append("path")
                .datum(d => getPathCoordinates(d))
                .attr("d", line)
                .attr("stroke-width", 5)
                .attr("stroke", (_, i) => colors[itemColors[players_set[i]]])
                .attr("fill", (_, i) => colors[itemColors[players_set[i]]])
                .attr("stroke-opacity", 1)
                .attr("fill-opacity", 0.1)
                .attr('class', 'path-cls')
        );

    // draw axis ticks
    
    svg.selectAll(".axisticks-cls").remove()
    for (var i = 0; i < ticks.length; i++){
        let tick_value = ticks[i];

        function round_number(x) {
            if (x >= 10) {
                return Math.round(x);
            }
            else {
                return Math.round(10 * x) / 10
            }
        }
        svg.selectAll(".axisticks")
            .data(featureData)
            .join(
                enter => enter.append("text")
                    .attr('class', 'axisticks-cls')
                    .attr("x", d => angleToCoordinate(d.angle, tick_value).x)
                    .attr("y", d => angleToCoordinate(d.angle, tick_value).y)
                    .style("fill", "blue")
                    .text(d => round_number(scales[d.name][0] + tick_value * (scales[d.name][1] - scales[d.name][0])))
            );
    }

}

d3.csv('./visualizations/players/all_players.csv', dataPreprocessor).then(function(input_dataset) {


    features = ["MINS", "G/90min", "S/90min", "GP", "SOG"];

    dataset_all = input_dataset

    x_pad = 0;
    y_pad = 0;
    width = 1300;
    height = 600;
    svg = d3.select(".player-div").append("svg")
        .attr("width", "180vh")
        .attr("height", "110vh")
        // .attr("left", "1000px");

    radialScale = d3.scaleLinear()
        .domain([0, 1])
        .range([0, 250]);
    ticks = [0.2, 0.4, 0.6, 0.8, 1.0];

    svg.selectAll("circle")
        .data(ticks)
        .join(
            enter => enter.append("circle")
                .attr("cx", x_pad + width / 2)
                .attr("cy", y_pad + height / 2)
                .attr("fill", "none")
                .attr("stroke", "gray")
                .attr("r", d => radialScale(d))
        );

    featureData = features.map((f, i) => {
        let angle = (Math.PI / 2) + (2 * Math.PI * i / features.length);
        let label_dist = 1.1
        if (i == 1) {
            label_dist = 1.5
        }
        if (i == 2) {
            label_dist = 1.3
        }
        if (i == 4) {
            label_dist = 1.2
        }
        return {
            "name": f,
            "angle": angle,
            "line_coord": angleToCoordinate(angle, 1),
            "label_coord": angleToCoordinate(angle, label_dist)
        };
    });

    // draw axis line
    svg.selectAll("line")
        .data(featureData)
        .join(
            enter => enter.append("line")
                .attr("x1", x_pad + width / 2)
                .attr("y1", y_pad + height / 2)
                .attr("x2", d => d.line_coord.x)
                .attr("y2", d => d.line_coord.y)
                .attr("stroke","black")
        );

    function present_names(name) {
        if (name == "SOG") {
            return "Shots on Goal (%)";
        }
        if (name == "G/90min") {
            return "Goals / 90min";
        }
        if (name == "S/90min") {
            return "Shots / 90min";
        }
        if (name == "GP") {
            return "Games Played";
        }
        if (name == "MINS") {
            return "Average Minutes Played per Game";
        }
        return name;
    }

    // draw axis label
    svg.selectAll(".axislabel")
        .data(featureData)
        .join(
            enter => enter.append("text")
                .attr("x", d => d.label_coord.x)
                .attr("y", d => d.label_coord.y)
                .text(d => present_names(d.name))
                .attr("font-weight", 700)
        );


    line = d3.line()
        .x(d => d.x)
        .y(d => d.y);
   
    var yearSelector = document.getElementById('yearSelector');
    for (var year = 2020; year >= 1996; year--) {
        var option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelector.appendChild(option);
    }

    var yearSelector = document.getElementById('yearSelector');
    selectedYear = 2020;

    yearSelector.addEventListener('change', function() {
        selectedYear = yearSelector.value;
        const elements = document.getElementsByClassName("tag");
        while(elements.length > 0){
            elements[0].parentNode.removeChild(elements[0]);
        }
        itemColors = {};
        selectedItems = new Set();

        // updateChart(selectedItems);
        updateData();
        updateChart({});
    });

    updateData();
    updateChart({});
    prepare_searchbox();

});


function addTag(item) {
    // Check if the tag already exists
    if (selectedItems.has(item)) {
      return;
    }

    selectedItems.add(item);

    var tagInput = document.getElementById('tagInput');

    let newColor = -1;
    for (let i = 0; i < colors.length; i++){
        let flag = 1;
        for (const [key, value] of Object.entries(itemColors)) {
            if (value == i) {
                flag = 0;
                break;
            }
        }
        if (flag == 1) {
            newColor = i
            break;
        }
    }

    itemColors[item] = newColor

    // Create a new tag element
    var tag = document.createElement('div');
    tag.classList.add('tag');
    tag.textContent = item;
    tag.style.backgroundColor = colors[newColor]; 

    

    // Create a close button for the tag
    var closeBtn = document.createElement('span');
    closeBtn.classList.add('tag-close');
    closeBtn.innerHTML = '&#10006;'; // Close symbol (you can use an icon library here)
    closeBtn.addEventListener('click', function() {
      // Remove the tag when the close button is clicked
      tag.parentNode.removeChild(tag);
      selectedItems.delete(item);
      delete itemColors[item];
      updateChart(selectedItems);
    });

    // Append the close button to the tag
    tag.appendChild(closeBtn);

    // Append the tag to the tag input container
    tagInput.appendChild(tag);

    updateChart(selectedItems);
}

function updateSearchBox() {
    var playerNames = new Set();;
    dataset.forEach(function(d) {
        playerNames.add(d["Player"]);
    });


    var dropdownContent = document.getElementById('itemDropdown');

    const elements = document.getElementsByClassName("searchbox-item");
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }

    playerNames.forEach(player => {
        // console.log(player)
        var li = document.createElement('li');
        li.dataset.item = player;
        li.textContent = player;
        li.classList.add("searchbox-item")
        li.addEventListener('click', function() {
            addTag(player);
            // Clear the search input and hide the dropdown after selection
            document.getElementById('searchInput').value = '';
            document.getElementById('itemDropdown').style.display = 'none';
        });
        dropdownContent.appendChild(li);
    });
}


function prepare_searchbox() {

    // Your JavaScript code remains unchanged
    selectedItems = new Set();

    document.getElementById('searchInput').addEventListener('input', function(event) {
      var searchTerm = event.target.value.toLowerCase();
      var items = document.querySelectorAll('#itemDropdown li');

      // Display the dropdown only when there are at least two characters in the search input
      document.getElementById('itemDropdown').style.display = searchTerm.length >= 2 ? 'block' : 'none';

      items.forEach(function(item) {
        var itemName = item.dataset.item.toLowerCase();
        var display = itemName.includes(searchTerm) ? 'block' : 'none';
        item.style.display = display;
      });
    });


    // Example usage: Add a tag when an item is selected from the dropdown
    var dropdownItems = document.querySelectorAll('#itemDropdown li');

    dropdownItems.forEach(function(item) {
      item.addEventListener('click', function() {
        var itemName = item.dataset.item;
        addTag(itemName);
        // Clear the search input and hide the dropdown after selection
        document.getElementById('searchInput').value = '';
        document.getElementById('itemDropdown').style.display = 'none';
      });
    });

    // Show/hide the dropdown based on the focus of the search input
    document.getElementById('searchInput').addEventListener('focus', function() {
      // Display the dropdown only when there are at least two characters in the search input
      var searchTerm = this.value.toLowerCase();
      document.getElementById('itemDropdown').style.display = searchTerm.length >= 2 ? 'block' : 'none';
    });

    document.getElementById('searchInput').addEventListener('blur', function() {
      // Use a timeout to allow the click event of the dropdown item to be triggered before hiding the dropdown
      setTimeout(function() {
        document.getElementById('itemDropdown').style.display = 'none';
      }, 200);
    });

    
    updateSearchBox()
}
